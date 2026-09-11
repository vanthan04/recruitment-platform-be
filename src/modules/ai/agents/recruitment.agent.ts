import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AiConversationMessage,
  IAiProvider,
} from '@/modules/ai/infrastructure/providers/ai-provider.interface';
import { ToolRegistry } from '@/modules/ai/tools/tool-registry';
import { buildRecruitmentSystemPrompt } from '@/modules/ai/prompts/recruitment.prompt';
import {
  MatchingResultSchema,
  SUBMIT_MATCHING_RESULT_TOOL_NAME,
  submitMatchingResultToolDefinition,
} from '@/modules/ai/schemas/matching-result.schema';
import {
  AiProviderException,
  InvalidAiOutputException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

// Generous enough for get_job + a couple of search_candidates/get_candidate
// calls + submit; a bound exists purely so a confused model can't loop
// forever and run up API cost on one HTTP request.
const MAX_TOOL_CALL_ROUNDS = 8;

/**
 * Single recruitment agent: LLM -> tool call -> tool execution -> tool
 * result -> LLM -> ... -> one submit_matching_result call, which is the
 * only way this loop ends with a result. Only tools present in the
 * ToolRegistry it's given can ever be executed — a tool_use naming
 * anything else is answered with an error tool_result, never executed.
 *
 * No LangGraph/MCP/multi-agent here by design — see CODEBASE_SUMMARY.md-
 * style docs once this ships for how this could evolve toward either.
 */
@Injectable()
export class RecruitmentAgent {
  private readonly logger = new Logger(RecruitmentAgent.name);

  constructor(private readonly aiProvider: IAiProvider) {}

  async run(
    tools: ToolRegistry,
    maxCandidates: number,
  ): Promise<MatchingResultSchema> {
    const knownCandidateIds = new Set<string>();
    const system = buildRecruitmentSystemPrompt(maxCandidates);
    const toolDefinitions = [
      ...tools.definitions,
      submitMatchingResultToolDefinition,
    ];
    const messages: AiConversationMessage[] = [
      {
        role: 'user',
        content:
          'Find and rank the best-matching candidates for this job. Start by calling get_job.',
      },
    ];

    for (let round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
      const response = await this.aiProvider.complete({
        system,
        messages,
        tools: toolDefinitions,
      });

      const submission = response.toolUses.find(
        (toolUse) => toolUse.name === SUBMIT_MATCHING_RESULT_TOOL_NAME,
      );
      if (submission) {
        return this.validateSubmission(submission.input, knownCandidateIds);
      }

      if (response.toolUses.length === 0) {
        // The model ended its turn without submitting — there is no valid
        // "plain text final answer" path, so this is an invalid response.
        this.logger.warn(
          `RecruitmentAgent: model stopped (${response.stopReason}) without calling ${SUBMIT_MATCHING_RESULT_TOOL_NAME}`,
        );
        throw new InvalidAiOutputException(
          'The AI provider ended its turn without submitting a result',
        );
      }

      messages.push({
        role: 'assistant',
        content: response.text,
        toolUses: response.toolUses,
      });

      const toolResults = await Promise.all(
        response.toolUses.map(async (toolUse) => {
          const tool = tools.get(toolUse.name);
          if (!tool) {
            this.logger.warn(
              `RecruitmentAgent: model requested unregistered tool "${toolUse.name}"`,
            );
            return {
              toolUseId: toolUse.id,
              content: `Tool "${toolUse.name}" does not exist. Only the tools you were given are available.`,
              isError: true,
            };
          }

          try {
            const result = await tool.execute(toolUse.input);
            this.collectCandidateIds(toolUse.name, result, knownCandidateIds);
            return { toolUseId: toolUse.id, content: JSON.stringify(result) };
          } catch (error) {
            this.logger.warn(
              `RecruitmentAgent: tool "${toolUse.name}" failed: ${(error as Error).message}`,
            );
            return {
              toolUseId: toolUse.id,
              content: `Tool "${toolUse.name}" failed: ${(error as Error).message}`,
              isError: true,
            };
          }
        }),
      );

      messages.push({ role: 'user', toolResults });
    }

    throw new AiProviderException(
      'The AI provider did not produce a result within the allowed number of tool-call rounds',
    );
  }

  private async validateSubmission(
    rawInput: Record<string, unknown>,
    knownCandidateIds: Set<string>,
  ): Promise<MatchingResultSchema> {
    const instance = plainToInstance(MatchingResultSchema, rawInput);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      this.logger.warn(
        `RecruitmentAgent: submit_matching_result failed schema validation: ${errors
          .map((e) => e.toString())
          .join('; ')}`,
      );
      throw new InvalidAiOutputException();
    }

    // Defense in depth: never trust a candidateId the model didn't actually
    // receive from search_candidates/get_candidate in this same run — see
    // module doc comment above.
    instance.matches = instance.matches.filter((match) => {
      const known = knownCandidateIds.has(match.candidateId);
      if (!known) {
        this.logger.warn(
          `RecruitmentAgent: dropped candidateId "${match.candidateId}" not seen in this run's tool results`,
        );
      }
      return known;
    });

    return instance;
  }

  private collectCandidateIds(
    toolName: string,
    result: unknown,
    knownCandidateIds: Set<string>,
  ): void {
    if (toolName !== 'search_candidates' && toolName !== 'get_candidate') {
      return;
    }
    const rows = Array.isArray(result) ? result : [result];
    for (const row of rows) {
      if (
        row &&
        typeof row === 'object' &&
        typeof (row as { candidateId?: unknown }).candidateId === 'string'
      ) {
        knownCandidateIds.add((row as { candidateId: string }).candidateId);
      }
    }
  }
}
