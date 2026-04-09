import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IFileStorageProvider } from './domain/providers/file-storage.provider.interface';
import { S3StorageProvider } from './infrastructure/storage/s3-storage.provider';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { FileUploadService } from './application/file-upload.service';
import { FileUploadController } from './presentation/controllers/file-upload.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FileUploadController],
  providers: [
    {
      provide: IFileStorageProvider,
      useClass: S3StorageProvider,
    },
    UploadFileUseCase,
    FileUploadService,
  ],
  exports: [FileUploadService],
})
export class FileUploadModule {}
