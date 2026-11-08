import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';

export const MESSAGE_DELETED_EVENT = 'message.deleted';

/**
 * Emitted after a message is soft-deleted. `message` is the already-masked
 * DTO (placeholder content, no attachments, `isDeleted: true`), so it is
 * safe to broadcast as-is.
 */
export class MessageDeletedEvent {
  readonly eventType = MESSAGE_DELETED_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly message: MessageResponseDto,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly recipientId: string,
  ) {
    this.occurredAt = new Date();
  }
}
