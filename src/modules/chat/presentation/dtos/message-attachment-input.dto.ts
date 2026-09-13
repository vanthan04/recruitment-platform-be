import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { UploadFolder } from '@/modules/file-upload/domain/value-objects/upload-folder.vo';

// Matches exactly what buildPrivateUploadKey(UploadFolder.CHAT_ATTACHMENTS, ...)
// produces (see upload-file.command.ts) — a backend-generated storage key,
// never a client-supplied URL. Kept as a literal regex (rather than importing
// isPrivateUploadKey) so this DTO stays declarative and `@Matches` can use it
// directly; create-message.command.ts re-checks with isPrivateUploadKey at
// the domain boundary as defense in depth.
const CHAT_ATTACHMENT_KEY_PATTERN = new RegExp(
  `^${UploadFolder.CHAT_ATTACHMENTS}/[0-9a-fA-F-]{36}\\.[A-Za-z0-9]+$`,
);

/**
 * The file itself is uploaded first via `POST /files/upload?folder=chat-attachments`,
 * which stores it privately and returns a storage key (never a public URL —
 * see upload-file.command.ts and PRIVATE_UPLOAD_FOLDERS). This DTO carries
 * that key to attach it to a message; the key is resolved into a short-lived
 * signed URL only when a conversation member reads the message
 * (see MessageAttachmentUrlResolver).
 */
export class MessageAttachmentInputDto {
  @ApiProperty({ example: 'resume.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    example: 'chat-attachments/1b6f... .pdf',
    description: 'Storage key returned by POST /files/upload, not a URL.',
  })
  @Matches(CHAT_ATTACHMENT_KEY_PATTERN, {
    message: 'fileKey must be a storage key returned by the upload endpoint',
  })
  @IsNotEmpty()
  fileKey: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimeType: string;

  @ApiProperty({ example: 102400 })
  @IsInt()
  @IsPositive()
  fileSize: number;
}
