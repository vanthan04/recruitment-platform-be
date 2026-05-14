export class ResponseDto<T> {
  success: boolean;
  message: string;
  code?: string;
  data?: T | T[];
  metadata?: Record<string, any>;
  timestamp: string;

  constructor(partial: Partial<ResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }
}
