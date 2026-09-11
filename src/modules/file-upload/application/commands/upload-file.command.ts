import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import {
  FileMissingException,
  InvalidFileTypeException,
} from '@/modules/file-upload/domain/exceptions/file-upload.exceptions';
import { FileUploadDomainService } from '@/modules/file-upload/domain/domain-services/file-upload-domain.service';
import {
  ALLOWED_MIME_TYPES_BY_FOLDER,
  UploadFolder,
} from '@/modules/file-upload/domain/value-objects/upload-folder.vo';

const DEFAULT_ALLOWED_MIME_TYPES =
  ALLOWED_MIME_TYPES_BY_FOLDER[UploadFolder.AVATARS];

export class UploadFileCommand extends Command<{ url: string }> {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly folder?: string,
    public readonly allowedMimeTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<
  UploadFileCommand,
  { url: string }
> {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async execute({
    file,
    folder,
    allowedMimeTypes,
  }: UploadFileCommand): Promise<{ url: string }> {
    if (!file) {
      throw new FileMissingException();
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(file.mimetype);
    }
    FileUploadDomainService.validateFileSignature(file);

    const url = await this.storageProvider.upload(file, folder);

    return { url };
  }
}
