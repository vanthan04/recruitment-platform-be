import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Params } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';
const HEALTHCHECK_PATH = '/api/v1/healthcheck';

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
      // request/response object.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.oldPassword',
          'req.body.newPassword',
          'req.body.refreshToken',
        ],
        censor: '**redacted**',
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
