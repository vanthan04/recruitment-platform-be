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

const USER_SENDABLE_TYPES = [
  MessageType.TEXT,
  MessageType.IMAGE,
  MessageType.FILE,
];

/**
 * Every WebSocket event that targets one conversation carries at least this
 * shape — reused as-is by `conversation:subscribe`/`unsubscribe`,
 * `message:read`, and `typing:start`/`stop`, and as the base for
 * `SendMessageWsDto`.
 */
export class ConversationIdWsDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;
}

/** Mirrors CreateMessageDto (the REST equivalent) — the WS transport gets no less validation than REST. */
export class SendMessageWsDto extends ConversationIdWsDto {
  @IsUUID()
  @IsNotEmpty()
  clientMessageId: string;

  @IsString()
  @MaxLength(5000)
  content: string;

  @IsIn(USER_SENDABLE_TYPES)
  @IsOptional()
  messageType?: MessageType;

  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  @IsOptional()
  attachments?: MessageAttachmentInputDto[];
}
