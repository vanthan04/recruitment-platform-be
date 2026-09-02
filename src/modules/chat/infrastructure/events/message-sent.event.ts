import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';

export const MESSAGE_SENT_EVENT = 'message.sent';

/**
 * Emitted after a message is persisted — by CreateMessageHandler, regardless
 * of whether the request came in over REST or the WS gateway. This is the
 * single place realtime broadcast (ChatGateway) and offline notification
 * (ChatEventsListener) both hang off, so neither transport can broadcast a
 * message the other one created without it.
 */
export class MessageSentEvent {
  readonly eventType = MESSAGE_SENT_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly message: MessageResponseDto,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly recipientId: string,
    public readonly jobTitle: string,
    public readonly preview: string,
  ) {
    this.occurredAt = new Date();
  }

  get messageId(): string {
    return this.message.id;
  }
}
