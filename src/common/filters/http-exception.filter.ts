import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';
import { ApiResponse } from '@/common/dtos/api-response';
import {
  DomainException,
  EntityNotFoundException,
  UnauthorizedDomainException,
  DuplicateEntityException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // Set by pino-http's genReqId (see common/config/logger.config.ts) — the
    // same id tags this request's access log line and every app log emitted
    // while handling it, so it's what to grep for when tracing a report.
    const requestId = (request as unknown as { id?: string })?.id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as { message: string | string[] }).message
          : ((res as string) ?? message);
      code = 'HTTP_ERROR';

      // Handle NestJS Validation errors
      if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
        code = 'VALIDATION_ERROR';
      }
    } else if (exception instanceof DomainException) {
      status = this.mapDomainExceptionToStatus(exception);
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        // Unique-constraint violation that reached the DB despite an
        // application-level check-then-insert (e.g. two near-simultaneous
        // requests racing past a check) — surface as a clean 409 instead of
        // a raw 500, without needing every call site to guess which race it
        // hit.
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTITY';
        const target = exception.meta?.target;
        message = Array.isArray(target)
          ? `A record with this ${target.join(', ')} already exists`
          : 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        // "Record to update/delete not found" — the read-then-write window
        // between a handler's own existence check and the actual write hit
        // a concurrent delete of that same row. Semantically a 404, not a 500.
        status = HttpStatus.NOT_FOUND;
        code = 'ENTITY_NOT_FOUND';
        message = 'The requested record no longer exists';
      } else if (exception.code === 'P2003') {
        // Foreign-key violation — a referenced id (category, skill, etc.)
        // that passed DTO shape validation but doesn't actually exist. A
        // client input problem, not a server error.
        status = HttpStatus.BAD_REQUEST;
        code = 'INVALID_REFERENCE';
        message = 'One or more referenced ids do not exist';
      }
      // Any other Prisma error code falls through to the generic 500 below —
      // deliberately not echoing Prisma's own message text to the client.
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const finalMessage = Array.isArray(message) ? message.join(', ') : message;

    const logPayload = {
      err: exception,
      code,
      path: request?.originalUrl ?? request?.url,
      method: request?.method,
      requestId,
    };
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logPayload, finalMessage);
    } else {
      this.logger.warn(logPayload, finalMessage);
    }

    // The log line above always carries the real message (and, via `err`,
    // the full exception/stack) for debugging — but a 5xx response body
    // never echoes it back to the client. This is deliberately independent
    // of *what* produced the 500 (a raw Error, an HttpException some
    // handler constructed with unsafe detail baked into its own message,
    // an unmapped Prisma error code): every DomainException and validation
    // error already resolves to a status below 500, so nothing legitimate
    // is lost by blanking the message once we're here.
    const clientMessage =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : finalMessage;
    const clientCode =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'INTERNAL_SERVER_ERROR'
        : code;

    response
      .status(status)
      .json(ApiResponse.fail(clientMessage, clientCode, undefined, { requestId }));
  }

  private mapDomainExceptionToStatus(exception: DomainException): number {
    if (exception instanceof EntityNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof UnauthorizedDomainException) {
      return HttpStatus.FORBIDDEN;
    }
    if (exception instanceof DuplicateEntityException) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof BusinessRuleViolationException) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
