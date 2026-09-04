import { Injectable } from '@nestjs/common';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import {
  ICvStoragePort,
  CvUploadParams,
} from '@/modules/cv/application/ports/cv-storage.port';

const DOWNLOAD_URL_EXPIRY_SECONDS = 300;

@Injectable()
export class CvStorageAdapter implements ICvStoragePort {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async upload({ key, buffer, mimeType }: CvUploadParams): Promise<void> {
    await this.storageProvider.uploadBuffer({ key, buffer, mimeType });
  }

  async delete(key: string): Promise<void> {
    await this.storageProvider.deleteByKey(key);
  }

  async getDownloadUrl(key: string, downloadFilename: string): Promise<string> {
    return this.storageProvider.getSignedUrl(key, {
      expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS,
      downloadFilename,
    });
  }
}
