import { ResponseDto } from './response.dto';

/**
 * Every controller builds its response through `ApiResponse.ok`/`fail` —
 * no call site ever needs anything more than that, so these are plain
 * factories rather than a chainable builder.
 */
export class ApiResponse {
  static ok<D = unknown>(
    data?: D | D[],
    message = '',
    metadata?: Record<string, any>,
    code?: string,
  ): ResponseDto<D> {
    return new ResponseDto<D>({
      success: true,
      message,
      code: code || 'SUCCESS',
      data,
      metadata,
    });
  }

  static fail<D = unknown>(
    message: string,
    code = 'ERROR',
    data?: D | D[],
    metadata?: Record<string, any>,
  ): ResponseDto<D> {
    return new ResponseDto<D>({
      success: false,
      message,
      code,
      data,
      metadata,
    });
  }
}
