import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MessageAttachmentInputDto } from '@/modules/chat/presentation/dtos/message-attachment-input.dto';

// SYSTEM is intentionally excluded — that type is reserved for
// server-generated messages, never a user-facing send.
const USER_SENDABLE_TYPES = [
  MessageType.TEXT,
  MessageType.IMAGE,
  MessageType.FILE,
];

export class CreateMessageDto {
  @ApiProperty({ example: 'Hi, thanks for accepting my application!' })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: USER_SENDABLE_TYPES, default: MessageType.TEXT })
  @IsIn(USER_SENDABLE_TYPES)
  @IsOptional()
  messageType?: MessageType;

  @ApiProperty({
    description:
      'Client-generated UUID — idempotency key for retries/reconnects',
    example: 'a1b2c3d4-...',
  })
  @IsUUID()
  @IsNotEmpty()
  clientMessageId: string;

  @ApiPropertyOptional({ type: [MessageAttachmentInputDto] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  @IsOptional()
  attachments?: MessageAttachmentInputDto[];
}
