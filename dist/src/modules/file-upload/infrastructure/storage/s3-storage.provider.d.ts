import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import { ConfigService } from '@nestjs/config';
export declare class S3StorageProvider implements IFileStorageProvider {
    private configService;
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    constructor(configService: ConfigService);
    upload(file: Express.Multer.File, folder?: string): Promise<string>;
    delete(fileUrl: string): Promise<void>;
}
