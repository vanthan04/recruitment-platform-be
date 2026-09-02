import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
export declare class UploadFileUseCase {
    private readonly storageProvider;
    constructor(storageProvider: IFileStorageProvider);
    execute(file: Express.Multer.File, folder?: string, allowedMimeTypes?: string[]): Promise<{
        url: string;
    }>;
}
