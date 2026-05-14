export declare class ResponseDto<T> {
    success: boolean;
    message: string;
    code?: string;
    data?: T | T[];
    metadata?: Record<string, any>;
    timestamp: string;
    constructor(partial: Partial<ResponseDto<T>>);
}
