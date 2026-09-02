import { Injectable, BadRequestException } from '@nestjs/common';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UploadFileUseCase {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async execute(
    file: Express.Multer.File,
    folder?: string,
    allowedMimeTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('FILE_NOT_FOUND');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_FILE_TYPE');
    }

    const url = await this.storageProvider.upload(file, folder);

    return { url };
  }
}
