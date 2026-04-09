import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception.message || 'Internal server error';
    let code = 'APP001';

    // Handle NestJS Validation errors (from Class-Validator)
    if (status === HttpStatus.BAD_REQUEST && exception.response) {
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'object' && responseBody['message']) {
        message = Array.isArray(responseBody['message'])
          ? responseBody['message'].join(', ')
          : responseBody['message'];
      }
      code = 'APP002';
    }

    // Custom App Error handling (matching Java's AppException)
    if (exception.code && typeof exception.code === 'string') {
      code = exception.code;
    }

    response.status(status).json({
      success: false,
      code: code,
      message: message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
