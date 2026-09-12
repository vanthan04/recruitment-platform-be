import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

const logger = new Logger('ChatModelProvider');

/**
 * DI tokens for each AI-driven capability's chat model. Every
 * agent/service depends on `BaseChatModel` (LangChain's own model
 * abstraction), never on a concrete class — each capability picks its own
 * provider/model independently via its own pair of env vars (see
 * env.validation.ts), so e.g. matching can run on Claude while screening
 * runs on GPT, without touching any service code.
 */
export const MATCHING_CHAT_MODEL = 'MATCHING_CHAT_MODEL';
export const CV_ANALYSIS_CHAT_MODEL = 'CV_ANALYSIS_CHAT_MODEL';
export const SCREENING_CHAT_MODEL = 'SCREENING_CHAT_MODEL';
export const SKILL_SUGGESTION_CHAT_MODEL = 'SKILL_SUGGESTION_CHAT_MODEL';
export const JOB_DRAFT_CHAT_MODEL = 'JOB_DRAFT_CHAT_MODEL';

export type AiCapability =
  'MATCHING' | 'CV_ANALYSIS' | 'SCREENING' | 'SKILL_SUGGESTION' | 'JOB_DRAFT';

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5.1',
  google: 'gemini-3-pro',
};

/**
 * A `BaseChatModel` stand-in used when a capability's provider can't be
 * constructed (e.g. missing API key) — every real chat model class here
 * (`ChatAnthropic` etc.) validates its API key in its *constructor* and
 * throws synchronously if it's missing, which would otherwise take down
 * the entire app at boot (this provider is wired into the global AiModule,
 * not lazily per-request) rather than failing only the one AI endpoint
 * that needed it. Mirrors this module's existing "optional so the app
 * still boots without it configured; fails at call time" rule for every
 * other AI env var (see env.validation.ts).
 */
function createUnavailableChatModel(
  capability: AiCapability,
  reason: string,
): BaseChatModel {
  const message = `AI capability ${capability} is not available: ${reason}`;
  return {
    bindTools: () => ({
      invoke: () => Promise.reject(new Error(message)),
    }),
  } as unknown as BaseChatModel;
}

/**
 * Builds the chat model for one capability, e.g. `buildChatModel(configService, 'SCREENING')`
 * reads `SCREENING_AI_PROVIDER`/`SCREENING_AI_MODEL` and the matching provider's API key
 * (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY`). `AI_TEMPERATURE` and
 * `AI_REQUEST_TIMEOUT_MS` are shared across every capability — only provider/model differ.
 */
export function buildChatModel(
  configService: ConfigService,
  capability: AiCapability,
): BaseChatModel {
  const provider = configService.get<string>(
    `${capability}_AI_PROVIDER`,
    'anthropic',
  );
  const model = configService.get<string>(
    `${capability}_AI_MODEL`,
    DEFAULT_MODEL_BY_PROVIDER[provider] ?? DEFAULT_MODEL_BY_PROVIDER.anthropic,
  );
  const temperature = configService.get<number>('AI_TEMPERATURE', 0.2);
  const timeout = configService.get<number>('AI_REQUEST_TIMEOUT_MS', 30_000);
  const maxTokens = configService.get<number>('AI_MAX_RESPONSE_TOKENS', 4096);

  try {
    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          apiKey: configService.get<string>('OPENAI_API_KEY'),
          model,
          temperature,
          timeout,
          maxTokens,
        });
      case 'google':
        return new ChatGoogleGenerativeAI({
          apiKey: configService.get<string>('GOOGLE_API_KEY'),
          model,
          temperature,
          maxOutputTokens: maxTokens,
        });
      case 'anthropic':
      default:
        return new ChatAnthropic({
          apiKey: configService.get<string>('ANTHROPIC_API_KEY'),
          model,
          temperature,
          maxTokens,
          clientOptions: { timeout },
        });
    }
  } catch (error) {
    const reason = (error as Error).message;
    logger.warn(
      `${capability} chat model (${provider}) could not be constructed — this capability will fail at call time until configured: ${reason}`,
    );
    return createUnavailableChatModel(capability, reason);
  }
}

export const matchingChatModelFactory = (configService: ConfigService) =>
  buildChatModel(configService, 'MATCHING');

export const cvAnalysisChatModelFactory = (configService: ConfigService) =>
  buildChatModel(configService, 'CV_ANALYSIS');

export const screeningChatModelFactory = (configService: ConfigService) =>
  buildChatModel(configService, 'SCREENING');

export const skillSuggestionChatModelFactory = (configService: ConfigService) =>
  buildChatModel(configService, 'SKILL_SUGGESTION');

export const jobDraftChatModelFactory = (configService: ConfigService) =>
  buildChatModel(configService, 'JOB_DRAFT');
