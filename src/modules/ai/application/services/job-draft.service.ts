import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { JOB_DRAFT_CHAT_MODEL } from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { translateProviderError } from '@/modules/ai/infrastructure/providers/provider-error.util';
import {
  JobDraft,
  SUBMIT_JOB_DRAFT_TOOL_NAME,
  jobDraftSchema,
  submitJobDraftTool,
} from '@/modules/ai/schemas/job-draft.schema';
import {
  JOB_DRAFT_SYSTEM_PROMPT,
  buildJobDraftUserMessage,
} from '@/modules/ai/prompts/job-draft.prompt';
import { InvalidAiOutputException } from '@/modules/ai/domain/exceptions/ai.exceptions';

/**
 * Single forced-tool completion — pure content generation, no domain
 * lookups or tools needed. Never creates or modifies a Job itself: the
 * recruiter reviews/edits the draft and calls the existing POST /jobs to
 * actually create it (see CreateJobCommand, untouched by this service).
 */
@Injectable()
export class JobDraftService {
  private readonly logger = new Logger(JobDraftService.name);

  constructor(
    @Inject(JOB_DRAFT_CHAT_MODEL) private readonly chatModel: BaseChatModel,
  ) {}

  async draftJob(hints: string): Promise<JobDraft> {
    let response: AIMessageChunk;
    try {
      response = await this.chatModel.bindTools!([submitJobDraftTool], {
        tool_choice: { type: 'tool', name: SUBMIT_JOB_DRAFT_TOOL_NAME },
      }).invoke([
        new SystemMessage(JOB_DRAFT_SYSTEM_PROMPT),
        new HumanMessage(buildJobDraftUserMessage(hints)),
      ]);
    } catch (error) {
      throw translateProviderError(error, this.logger);
    }

    const toolCall = response.tool_calls?.find(
      (call) => call.name === SUBMIT_JOB_DRAFT_TOOL_NAME,
    );
    if (!toolCall) {
      this.logger.warn('JobDraftService: model did not call submit_job_draft');
      throw new InvalidAiOutputException(
        'The AI provider did not submit a job draft',
      );
    }

    const parseResult = jobDraftSchema.safeParse(toolCall.args);
    if (!parseResult.success) {
      this.logger.warn(
        `JobDraftService: submission failed schema validation: ${parseResult.error.message}`,
      );
      throw new InvalidAiOutputException();
    }

    return parseResult.data;
  }
}
