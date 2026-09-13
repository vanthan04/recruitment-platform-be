import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import * as path from 'path';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import {
  FileMissingException,
  InvalidFileTypeException,
} from '@/modules/file-upload/domain/exceptions/file-upload.exceptions';
import { FileUploadDomainService } from '@/modules/file-upload/domain/domain-services/file-upload-domain.service';
import {
  ALLOWED_MIME_TYPES_BY_FOLDER,
  UploadFolder,
  buildPrivateUploadKey,
  isPrivateUploadFolder,
} from '@/modules/file-upload/domain/value-objects/upload-folder.vo';

const DEFAULT_ALLOWED_MIME_TYPES =
  ALLOWED_MIME_TYPES_BY_FOLDER[UploadFolder.AVATARS];

export interface UploadFileResult {
  /** Set for public folders (avatars, company-logos) — usable directly. */
  url?: string;
  /**
   * Set for private folders (chat-attachments) instead of `url` — an opaque
   * storage key, never a fetchable link on its own. The caller must exchange
   * it for a short-lived signed URL at read time (see
   * MessageAttachmentUrlResolver in the chat module) rather than persist or
   * expose it directly.
   */
  key?: string;
}

export class UploadFileCommand extends Command<UploadFileResult> {
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
  UploadFileResult
> {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async execute({
    file,
    folder,
    allowedMimeTypes,
  }: UploadFileCommand): Promise<UploadFileResult> {
    if (!file) {
      throw new FileMissingException();
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(file.mimetype);
    }
    FileUploadDomainService.validateFileSignature(file);

    if (folder && isPrivateUploadFolder(folder)) {
      const key = buildPrivateUploadKey(
        folder,
        path.extname(file.originalname),
      );
      await this.storageProvider.uploadBuffer({
        key,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });
      return { key };
    }

    const url = await this.storageProvider.upload(file, folder);
    return { url };
  }
}
