import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
  GraphRecursionError,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MATCHING_CHAT_MODEL } from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { translateProviderError } from '@/modules/ai/infrastructure/providers/provider-error.util';
import { MatchingToolRegistry } from '@/modules/ai/tools/matching-tool-registry';
import { buildRecruitmentSystemPrompt } from '@/modules/ai/prompts/recruitment.prompt';
import {
  matchingResultSchema,
  MatchingResult,
  SUBMIT_MATCHING_RESULT_TOOL_NAME,
  submitMatchingResultTool,
} from '@/modules/ai/schemas/matching-result.schema';
import {
  AiProviderException,
  InvalidAiOutputException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

// Generous enough for get_job + a couple of search_candidates/get_candidate
// calls + submit; a bound exists purely so a confused model can't loop
// forever and run up API cost on one HTTP request. LangGraph's
// recursionLimit counts every node step (agent+tools each count), hence *2.
const MAX_TOOL_CALL_ROUNDS = 8;

type GraphState = typeof MessagesAnnotation.State;

/**
 * Single recruitment agent, orchestrated as a small LangGraph StateGraph:
 * "agent" (calls the model with tools bound) <-> "tools" (executes the
 * MatchingToolRegistry's tools) until the model calls submit_matching_result or
 * stops calling tools. Deliberately ONE agent node today — adding a second
 * agent later means adding another node/edge to this same graph (or
 * composing a subgraph), not restructuring how this one works.
 *
 * Only tools present in the MatchingToolRegistry it's given can ever be executed —
 * they're the only ones passed into the ToolNode below. submit_matching_result
 * is bound to the model so it CAN be called, but is intentionally excluded
 * from the ToolNode: it never "runs" against a domain service, it's a
 * terminal signal whose arguments are read and schema-validated directly.
 *
 * No multi-agent/supervisor/MCP here by design — see the module's README
 * section (once documented) for how this graph could grow into either.
 */
@Injectable()
export class RecruitmentAgent {
  private readonly logger = new Logger(RecruitmentAgent.name);

  constructor(
    @Inject(MATCHING_CHAT_MODEL) private readonly model: BaseChatModel,
  ) {}

  async run(
    tools: MatchingToolRegistry,
    maxCandidates: number,
  ): Promise<MatchingResult> {
    const system = buildRecruitmentSystemPrompt(maxCandidates);
    // Non-null: every concrete BaseChatModel this app actually configures
    // (see chat-model.provider.ts) supports tool calling — bindTools is
    // only optional on the base type for chat models that categorically
    // can't do tool calling at all.
    const modelWithTools = this.model.bindTools!([
      ...tools.tools,
      submitMatchingResultTool,
    ]);

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('agent', async (state: GraphState) => {
        const response = await modelWithTools.invoke([
          new SystemMessage(system),
          ...state.messages,
        ]);
        return { messages: [response] };
      })
      .addNode('tools', new ToolNode(tools.tools))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', (state: GraphState) =>
        this.routeAfterAgent(state.messages),
      )
      .addEdge('tools', 'agent')
      .compile();

    let finalMessages: BaseMessage[];
    try {
      const result = await graph.invoke(
        {
          messages: [
            new HumanMessage(
              'Find and rank the best-matching candidates for this job. Start by calling get_job.',
            ),
          ],
        },
        { recursionLimit: MAX_TOOL_CALL_ROUNDS * 2 + 2 },
      );
      finalMessages = result.messages;
    } catch (error) {
      if (error instanceof GraphRecursionError) {
        this.logger.warn(
          `RecruitmentAgent: exceeded ${MAX_TOOL_CALL_ROUNDS} tool-call rounds without a submission`,
        );
        throw new AiProviderException(
          'The AI provider did not produce a result within the allowed number of tool-call rounds',
        );
      }
      throw translateProviderError(error, this.logger);
    }

    return this.extractSubmission(finalMessages);
  }

  private routeAfterAgent(messages: BaseMessage[]): 'tools' | typeof END {
    const last = messages[messages.length - 1] as AIMessage;
    const toolCalls = last.tool_calls ?? [];
    if (toolCalls.length === 0) return END;

    const hasSubmission = toolCalls.some(
      (call) => call.name === SUBMIT_MATCHING_RESULT_TOOL_NAME,
    );
    if (hasSubmission) return END;

    return 'tools';
  }

  private extractSubmission(messages: BaseMessage[]): MatchingResult {
    const last = messages[messages.length - 1] as AIMessage;
    const toolCalls = last.tool_calls ?? [];
    const submission = toolCalls.find(
      (call) => call.name === SUBMIT_MATCHING_RESULT_TOOL_NAME,
    );

    if (!submission) {
      this.logger.warn(
        `RecruitmentAgent: model stopped without calling ${SUBMIT_MATCHING_RESULT_TOOL_NAME}`,
      );
      throw new InvalidAiOutputException(
        'The AI provider ended its turn without submitting a result',
      );
    }

    const parseResult = matchingResultSchema.safeParse(submission.args);
    if (!parseResult.success) {
      this.logger.warn(
        `RecruitmentAgent: submit_matching_result failed schema validation: ${parseResult.error.message}`,
      );
      throw new InvalidAiOutputException();
    }

    // Defense in depth: never trust a candidateId the model didn't actually
    // receive from search_candidates/get_candidate in this same run — see
    // class doc comment above.
    const knownCandidateIds = this.collectKnownCandidateIds(messages);
    const matches = parseResult.data.matches.filter((match) => {
      const known = knownCandidateIds.has(match.candidateId);
      if (!known) {
        this.logger.warn(
          `RecruitmentAgent: dropped candidateId "${match.candidateId}" not seen in this run's tool results`,
        );
      }
      return known;
    });

    return { matches };
  }

  private collectKnownCandidateIds(messages: BaseMessage[]): Set<string> {
    const toolCallNameById = new Map<string, string>();
    for (const message of messages) {
      if (!(message instanceof AIMessage)) continue;
      for (const call of message.tool_calls ?? []) {
        if (call.id) toolCallNameById.set(call.id, call.name);
      }
    }

    const ids = new Set<string>();
    for (const message of messages) {
      if (!(message instanceof ToolMessage)) continue;
      const toolName = toolCallNameById.get(message.tool_call_id);
      if (toolName !== 'search_candidates' && toolName !== 'get_candidate') {
        continue;
      }
      const rows = this.parseToolMessageContent(message.content);
      for (const row of rows) {
        if (
          row &&
          typeof row === 'object' &&
          typeof (row as { candidateId?: unknown }).candidateId === 'string'
        ) {
          ids.add((row as { candidateId: string }).candidateId);
        }
      }
    }
    return ids;
  }

  private parseToolMessageContent(content: unknown): unknown[] {
    try {
      const parsed: unknown =
        typeof content === 'string' ? JSON.parse(content) : content;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
}
