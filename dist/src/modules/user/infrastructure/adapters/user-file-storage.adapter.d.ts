import { IUserFileStoragePort } from '@/modules/user/application/ports/user-file-storage.port';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';
export declare class UserFileStorageAdapter implements IUserFileStoragePort {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}
