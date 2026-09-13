import { Injectable } from '@nestjs/common';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import {
  UploadFolder,
  isPrivateUploadKey,
} from '@/modules/file-upload/domain/value-objects/upload-folder.vo';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';

// Attachments are read many times over a conversation's lifetime (unlike a
// CV, which is downloaded once per click) — every read re-resolves the key,
// so this only needs to outlive one page render, not one user session.
const ATTACHMENT_URL_EXPIRY_SECONDS = 300;

/**
 * Chat attachments are stored as a private S3 key, never a public URL (see
 * PRIVATE_UPLOAD_FOLDERS / upload-file.command.ts) — this turns that key
 * into a short-lived signed URL at read time, on every REST/WS response that
 * carries a message or a conversation's lastMessage preview.
 *
 * This has to happen at read time rather than once at write time because a
 * signed URL embeds an expiry; a message can be (and typically is) read
 * again long after that expiry, so only the stable key can be persisted —
 * never a signed URL.
 *
 * A `fileUrl` that's already a full URL (an attachment created before this
 * fix, back when uploads went through the public path) is left untouched —
 * there's nothing to resolve, and re-signing it would be meaningless.
 */
@Injectable()
export class MessageAttachmentUrlResolver {
  constructor(private readonly fileStorage: IFileStorageProvider) {}

  async resolve(dto: MessageResponseDto): Promise<MessageResponseDto> {
    if (dto.attachments.length === 0) return dto;

    await Promise.all(
      dto.attachments.map(async (attachment) => {
        if (
          isPrivateUploadKey(UploadFolder.CHAT_ATTACHMENTS, attachment.fileUrl)
        ) {
          attachment.fileUrl = await this.fileStorage.getSignedUrl(
            attachment.fileUrl,
            {
              expiresInSeconds: ATTACHMENT_URL_EXPIRY_SECONDS,
              downloadFilename: attachment.fileName,
            },
          );
        }
      }),
    );

    return dto;
  }

  async resolveMany(dtos: MessageResponseDto[]): Promise<MessageResponseDto[]> {
    await Promise.all(dtos.map((dto) => this.resolve(dto)));
    return dtos;
  }

  async resolveNullable(
    dto: MessageResponseDto | null,
  ): Promise<MessageResponseDto | null> {
    return dto ? this.resolve(dto) : null;
  }
}
