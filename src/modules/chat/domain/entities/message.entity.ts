import { BaseEntity } from '@/common/domain/base.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MessageAttachment } from '@/modules/chat/domain/entities/message-attachment.entity';
import {
  NotMessageSenderException,
  CannotEditDeletedMessageException,
  OnlyTextMessagesEditableException,
  MessageContentEmptyException,
  MessageAlreadyDeletedException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

const DELETED_MESSAGE_PLACEHOLDER = 'Tin nhắn này đã bị xoá';

/**
 * Message Aggregate Root.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  clientMessageId: string;
  deletedAt: Date | null;
  attachments: MessageAttachment[];

  constructor(partial: Partial<Message>) {
    super();
    Object.assign(this, partial);
    this.messageType = partial.messageType ?? MessageType.TEXT;
    this.deletedAt = partial.deletedAt ?? null;
    this.attachments = partial.attachments ?? [];
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /** Content as it should be shown to clients — masked once deleted. */
  displayContent(): string {
    return this.isDeleted ? DELETED_MESSAGE_PLACEHOLDER : this.content;
  }

  ensureSender(userId: string): void {
    if (this.senderId !== userId) {
      throw new NotMessageSenderException();
    }
  }

  edit(newContent: string): void {
    if (this.isDeleted) {
      throw new CannotEditDeletedMessageException();
    }
    if (this.messageType !== MessageType.TEXT) {
      throw new OnlyTextMessagesEditableException();
    }
    const trimmed = newContent.trim();
    if (!trimmed) {
      throw new MessageContentEmptyException();
    }
    this.content = trimmed;
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new MessageAlreadyDeletedException();
    }
    this.deletedAt = new Date();
  }
}
