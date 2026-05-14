import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '@/common/dtos/api-response';
import {
  DomainException,
  EntityNotFoundException,
  UnauthorizedDomainException,
  DuplicateEntityException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'object' ? res.message : res;
      code = 'HTTP_ERROR';

      // Handle NestJS Validation errors
      if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
        message = message.join(', ');
        code = 'VALIDATION_ERROR';
      }
    } else if (exception instanceof DomainException) {
      status = this.mapDomainExceptionToStatus(exception);
      message = exception.message;
      code = exception.code;
    } else {
      // Logic for unexpected errors (logging, etc.)
      this.logger.error(exception);
      if (exception.message) {
        message = exception.message;
      }
    }

    response.status(status).json(ApiResponse.fail(message, code));
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
