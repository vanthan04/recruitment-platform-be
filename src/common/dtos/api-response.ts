import { ResponseDto } from './response.dto';

export class ApiResponse<T = any> {
  private _success = true;
  private _message = '';
  private _data?: T | T[];
  private _metadata?: Record<string, any>;

  success(ok: boolean): this {
    this._success = ok;
    return this;
  }

  message(msg: string): this {
    this._message = msg;
    return this;
  }

  data<D = T>(payload: D | D[]): ApiResponse<D> {
    const next = new ApiResponse<D>();
    next._success = this._success;
    next._message = this._message;
    next._metadata = this._metadata;
    next._data = payload;
    return next;
  }

  metadata(meta?: Record<string, any>): this {
    this._metadata = meta;
    return this;
  }

  build(): ResponseDto<T> {
    return new ResponseDto<T>({
      success: this._success,
      message: this._message,
      data: this._data,
      metadata: this._metadata,
    });
  }

  static ok<D = any>(data?: D | D[], message = '', metadata?: Record<string, any>) {
    return new ApiResponse<D>()
      .success(true)
      .message(message)
      .metadata(metadata)
      .data(data as D | D[])
      .build();
  }

  static fail<D = any>(message: string, data?: D | D[], metadata?: Record<string, any>) {
    return new ApiResponse<D>()
      .success(false)
      .message(message)
      .metadata(metadata)
      .data(data as D | D[])
      .build();
  }
}
