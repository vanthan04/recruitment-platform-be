import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * DI token for the chat model RecruitmentAgent/CvAnalysisService depend on
 * — they're written against `BaseChatModel` (LangChain's own model
 * abstraction: generate/tool-calling/structured-output/model config), never
 * against `ChatAnthropic` directly, so swapping AI_PROVIDER later means
 * adding a branch here, not touching either service. AI_PROVIDER only
 * supports "anthropic" today (see env.validation.ts) — this factory is the
 * one place that would grow a second branch.
 */
export const CHAT_MODEL = 'CHAT_MODEL';

const MAX_RESPONSE_TOKENS = 4096;

export function chatModelFactory(configService: ConfigService): BaseChatModel {
  return new ChatAnthropic({
    apiKey: configService.get<string>('AI_API_KEY'),
    model: configService.get<string>('AI_MODEL', 'claude-sonnet-5'),
    temperature: configService.get<number>('AI_TEMPERATURE', 0.2),
    maxTokens: MAX_RESPONSE_TOKENS,
    clientOptions: {
      timeout: configService.get<number>('AI_REQUEST_TIMEOUT_MS', 30_000),
    },
  });
}
