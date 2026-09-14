import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Params } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';
const HEALTHCHECK_PATH = '/api/v1/healthcheck';

const SECRET_KEY_PATTERN = /password|token|secret|apikey|authorization|cookie/i;
const REDACTED = '**redacted**';
const MAX_REDACT_DEPTH = 6;
// pino applies its own req/res/err serializers (see `serializers` below,
// plus its built-in default for `err`) to the value under these top-level
// keys, and does so to whatever `formatters.log` returns — never touch
// them here, or the custom req/res shape and, critically, err's
// stack/message (verified empirically: without this exclusion, an Error
// instance gets flattened to its own enumerable properties only, e.g.
// `{code: '...'}`, losing message/stack entirely before pino's err
// serializer ever runs).
const PINO_SERIALIZED_KEYS = new Set(['req', 'res', 'err']);

/**
 * Recursively redacts any key matching SECRET_KEY_PATTERN, anywhere in a
 * log object's own structure (arbitrary depth, arrays included) — a
 * pattern-based backstop alongside the exact-path `redact.paths` list
 * below. `redact.paths` only catches a secret at a path someone thought to
 * enumerate in advance; this catches one by name regardless of where it
 * ends up nested (a new DTO field, a manually-logged object, etc.).
 */
export function redactSecretsDeep(value: unknown, depth = 0): unknown {
  if (depth > MAX_REDACT_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSecretsDeep(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (depth === 0 && PINO_SERIALIZED_KEYS.has(key)) {
      result[key] = val;
      continue;
    }
    result[key] = SECRET_KEY_PATTERN.test(key)
      ? REDACTED
      : redactSecretsDeep(val, depth + 1);
  }
  return result;
}

/**
 * pino/pino-http setup shared by the local server and the Lambda entry
 * point (both go through `createHttpApp`/`createAppContext` in bootstrap.ts).
 *
 * The request id generated here is what ties one HTTP request's access log,
 * every app log emitted while handling it, and its error log (see
 * GlobalExceptionFilter) together — nestjs-pino binds it via
 * AsyncLocalStorage, so any injected `Logger`/`PinoLogger` picks it up
 * automatically without threading it through call signatures.
 */
export const buildLoggerOptions = (): Params => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const forwarded = req.headers[REQUEST_ID_HEADER];
        const id =
          (Array.isArray(forwarded) ? forwarded[0] : forwarded) || randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },

      // Never let secrets end up in logs, even if a handler logs a raw
      // request/response object. Two layers: this exact-path list catches
      // known shapes fast; formatters.log below (redactSecretsDeep) is the
      // pattern-based backstop for anything not enumerated here — e.g. a
      // secret-shaped field added to some other DTO/object later that
      // nobody remembered to list here. Kept even though the custom req/res
      // serializers below already strip body/headers from the *automatic*
      // access log (so these particular paths are inert for that one
      // path today) — this still matters for any manually-logged object
      // shaped like `{ req: { headers, body } }` elsewhere.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.oldPassword',
          'req.body.newPassword',
          'req.body.refreshToken',
          // Email-verification / password-reset / OAuth-exchange codes —
          // each is a single-use secret that alone can verify an email,
          // reset a password, or complete a login.
          'req.body.code',
        ],
        censor: '**redacted**',
      },

      formatters: {
        log: (obj: Record<string, unknown>) =>
          redactSecretsDeep(obj) as Record<string, unknown>,
      },

      // Skip the request/response bulk of pino-http's default serializers —
      // keep only what's useful for tracing a request from the log line.
      serializers: {
        req: (req: IncomingMessage & { id?: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
      },

      autoLogging: {
        ignore: (req) => req.url === HEALTHCHECK_PATH,
      },

      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          },
    },
  };
};
