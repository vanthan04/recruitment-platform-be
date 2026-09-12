import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ListSkillsQuery } from '@/modules/skill/application/queries/list-skills.query';
import { SkillResponseDto } from '@/modules/skill/application/dto/skill-response.dto';
import { SKILL_SUGGESTION_CHAT_MODEL } from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { translateProviderError } from '@/modules/ai/infrastructure/providers/provider-error.util';
import {
  SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME,
  skillSuggestionSchema,
  submitSkillSuggestionsTool,
} from '@/modules/ai/schemas/skill-suggestion.schema';
import {
  SKILL_SUGGESTION_SYSTEM_PROMPT,
  buildSkillSuggestionUserMessage,
} from '@/modules/ai/prompts/skill-suggestion.prompt';
import { InvalidAiOutputException } from '@/modules/ai/domain/exceptions/ai.exceptions';

/**
 * Single forced-tool completion (no LangGraph loop — there is no domain
 * data to look up beyond the one deterministic ListSkillsQuery call, so
 * there is nothing for the model to decide to fetch). The taxonomy is
 * always fetched first and passed in full; the model can only ever
 * "suggest" ids that were actually in that list — anything else is
 * dropped, never trusted, same as matching's candidateId cross-check.
 */
@Injectable()
export class SkillSuggestionService {
  private readonly logger = new Logger(SkillSuggestionService.name);

  constructor(
    private readonly queryBus: QueryBus,
    @Inject(SKILL_SUGGESTION_CHAT_MODEL)
    private readonly chatModel: BaseChatModel,
  ) {}

  async suggestSkills(
    title: string | undefined,
    description: string,
  ): Promise<SkillResponseDto[]> {
    const taxonomy: SkillResponseDto[] = await this.queryBus.execute(
      new ListSkillsQuery(),
    );
    if (taxonomy.length === 0) return [];

    let response: AIMessageChunk;
    try {
      response = await this.chatModel.bindTools!([submitSkillSuggestionsTool], {
        tool_choice: {
          type: 'tool',
          name: SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME,
        },
      }).invoke([
        new SystemMessage(SKILL_SUGGESTION_SYSTEM_PROMPT),
        new HumanMessage(
          buildSkillSuggestionUserMessage(title, description, taxonomy),
        ),
      ]);
    } catch (error) {
      throw translateProviderError(error, this.logger);
    }

    const toolCall = response.tool_calls?.find(
      (call) => call.name === SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME,
    );
    if (!toolCall) {
      this.logger.warn(
        'SkillSuggestionService: model did not call submit_skill_suggestions',
      );
      throw new InvalidAiOutputException(
        'The AI provider did not submit skill suggestions',
      );
    }

    const parseResult = skillSuggestionSchema.safeParse(toolCall.args);
    if (!parseResult.success) {
      this.logger.warn(
        `SkillSuggestionService: submission failed schema validation: ${parseResult.error.message}`,
      );
      throw new InvalidAiOutputException();
    }

    const validIds = new Set(parseResult.data.skillIds);
    return taxonomy.filter((skill) => validIds.has(skill.id));
  }
}
