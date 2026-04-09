import { ResponseDto } from './response.dto';
export declare class ApiResponse<T = any> {
    private _success;
    private _message;
    private _data?;
    private _metadata?;
    success(ok: boolean): this;
    message(msg: string): this;
    data<D = T>(payload: D | D[]): ApiResponse<D>;
    metadata(meta?: Record<string, any>): this;
    build(): ResponseDto<T>;
    static ok<D = any>(data?: D | D[], message?: string, metadata?: Record<string, any>): ResponseDto<D>;
    static fail<D = any>(message: string, data?: D | D[], metadata?: Record<string, any>): ResponseDto<D>;
}
