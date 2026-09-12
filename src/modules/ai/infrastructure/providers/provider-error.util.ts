import { Logger } from '@nestjs/common';
import {
  AiProviderException,
  AiTimeoutException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

/**
 * Shared translation from a raw provider SDK error (Anthropic/OpenAI/Google,
 * whichever `buildChatModel` constructed) into one of this module's own
 * DomainExceptions — used by every agent/service that calls a chat model
 * directly. Duck-typed rather than `instanceof` against a specific SDK's
 * error class: three different provider SDKs are in play, and none of
 * their error classes are re-exported through LangChain in a way worth
 * depending on directly.
 *
 * The real error (status, message) is logged server-side only — never
 * handed to the client, which only ever sees the fixed DomainException
 * message (GlobalExceptionFilter maps ExternalServiceException to 503).
 */
export function translateProviderError(error: unknown, logger: Logger): Error {
  const err = error as { name?: string; status?: number; message?: string };
  if (
    err?.name === 'APIConnectionTimeoutError' ||
    err?.name === 'TimeoutError'
  ) {
    logger.error(`AI provider request timed out: ${err.message}`);
    return new AiTimeoutException();
  }
  if (typeof err?.status === 'number') {
    logger.error(
      `AI provider API error (status ${err.status}): ${err.message}`,
    );
    return new AiProviderException();
  }
  logger.error(
    `Unexpected error calling AI provider: ${(error as Error)?.message}`,
    (error as Error)?.stack,
  );
  return new AiProviderException();
}
