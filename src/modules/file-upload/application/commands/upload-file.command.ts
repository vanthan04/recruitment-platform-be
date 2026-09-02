import { Injectable, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadFileCommand {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly folder?: string,
    public readonly allowedMimeTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES,
  ) {}
}

@Injectable()
@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand, { url: string }> {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async execute({ file, folder, allowedMimeTypes }: UploadFileCommand): Promise<{ url: string }> {
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
