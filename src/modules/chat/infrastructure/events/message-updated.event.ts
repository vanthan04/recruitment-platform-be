import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';

export const MESSAGE_UPDATED_EVENT = 'message.updated';

/**
 * Emitted after a message's content is edited. ChatGateway turns it into a
 * `message:updated` broadcast so the other participant (and the sender's
 * other tabs) see the edit without reloading.
 */
export class MessageUpdatedEvent {
  readonly eventType = MESSAGE_UPDATED_EVENT;
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
