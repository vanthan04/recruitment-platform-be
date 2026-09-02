import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { IFileStorageProvider } from './domain/providers/file-storage.provider.interface';
import { S3StorageProvider } from './infrastructure/storage/s3-storage.provider';
import { UploadFileHandler } from './application/commands/upload-file.command';
import { FileUploadService } from './application/file-upload.service';
import { FileUploadController } from './presentation/controllers/file-upload.controller';

@Module({
  imports: [CqrsModule, ConfigModule],
  controllers: [FileUploadController],
  providers: [
    {
      provide: IFileStorageProvider,
      useClass: S3StorageProvider,
    },
    UploadFileHandler,
    FileUploadService,
  ],
  exports: [FileUploadService],
})
export class FileUploadModule {}
