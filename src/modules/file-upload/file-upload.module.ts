import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IFileStorageProvider } from './domain/providers/file-storage.provider.interface';
import { S3StorageProvider } from './infrastructure/storage/s3-storage.provider';
import { SupabaseStorageProvider } from './infrastructure/storage/supabase-storage.provider';
import { UploadFileHandler } from './application/commands/upload-file.command';
import { FileUploadService } from './application/file-upload.service';
import { FileUploadController } from './presentation/controllers/file-upload.controller';

@Module({
  imports: [CqrsModule, ConfigModule],
  controllers: [FileUploadController],
  providers: [
    {
      provide: IFileStorageProvider,
      // STORAGE_PROVIDER picks which backend talks to storage — 's3' (the
      // default: real AWS S3, LocalStack for local dev, or any other
      // S3-compatible endpoint via S3_ENDPOINT) or 'supabase' (Supabase
      // Storage's own S3-compatible API, with its own env vars).
      useFactory: (configService: ConfigService) =>
        configService.get<string>('STORAGE_PROVIDER', 's3') === 'supabase'
          ? new SupabaseStorageProvider(configService)
          : new S3StorageProvider(configService),
      inject: [ConfigService],
    },
    UploadFileHandler,
    FileUploadService,
  ],
  exports: [FileUploadService, IFileStorageProvider],
})
export class FileUploadModule {}
