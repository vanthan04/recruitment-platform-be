import { UploadFileUseCase } from './use-cases/upload-file.use-case';
export declare class FileUploadService {
    private readonly uploadFileUseCase;
    constructor(uploadFileUseCase: UploadFileUseCase);
    uploadFile(file: Express.Multer.File, folder?: string, allowedMimeTypes?: string[]): Promise<{
        url: string;
    }>;
}
