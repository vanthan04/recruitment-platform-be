import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DomainException } from '@/common/exceptions/domain.exception';

/**
 * A validation failure the gateway is safe to report back to the client
 * verbatim — as opposed to an arbitrary Error, which might carry internal
 * details (a raw Prisma message, a stack-adjacent string) that should never
 * reach a socket. See `getSafeErrorMessage`.
 */
export class WsValidationException extends Error {}

/**
 * The REST path gets input validation for free from the global
 * `ValidationPipe` (see bootstrap.ts); this is the WebSocket-transport
 * equivalent, called explicitly at the top of every `@SubscribeMessage`
 * handler so a malformed/oversized/wrong-typed payload never reaches the
 * command bus.
 */
export async function validateWsPayload<T extends object>(
  cls: new () => T,
  plain: unknown,
): Promise<T> {
  const instance = plainToInstance(cls, plain ?? {});
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new WsValidationException(messages.join('; ') || 'Invalid payload');
  }
  return instance;
}

/**
 * Only known-safe exception types get their `.message` echoed back to a
 * socket — a `DomainException` (or subclass) was already written as a
 * user-facing message, and `WsValidationException` only ever contains
 * class-validator constraint text. Anything else (a raw Prisma error, a
 * TypeError from malformed data, a network failure) is logged server-side
 * and replaced with a generic message, mirroring how GlobalExceptionFilter
 * already treats the REST transport.
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof DomainException || error instanceof WsValidationException) {
    return error.message;
  }
  return 'Something went wrong, please try again';
}
