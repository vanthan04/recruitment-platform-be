import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

/**
 * The file itself is uploaded first via the existing `POST /files/upload`
 * (same trust model as avatar/CV upload elsewhere in this codebase) — this
 * DTO just carries the returned metadata to attach it to a message.
 */
export class MessageAttachmentInputDto {
  @ApiProperty({ example: 'resume.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    example: 'https://bucket.s3.amazonaws.com/chat-attachments/xxx.pdf',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  fileUrl: string;

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
