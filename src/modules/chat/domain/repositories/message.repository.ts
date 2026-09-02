import { Message } from '@/modules/chat/domain/entities/message.entity';

export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
}

export abstract class IMessageRepository {
  abstract findById(id: string): Promise<Message | null>;
  abstract findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null>;
  abstract create(message: Message): Promise<Message>;
  abstract update(message: Message): Promise<Message>;
  abstract findPage(
    conversationId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<MessagePage>;
  abstract findLastMessage(conversationId: string): Promise<Message | null>;
  abstract countUnread(
    conversationId: string,
    userId: string,
    since: Date | null,
  ): Promise<number>;
}
