import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageAttachment } from '@/modules/chat/domain/entities/message-attachment.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';

export class MessageMapper {
  static toDomain(raw: any): Message | null {
    if (!raw) return null;

    return new Message({
      id: raw.id,
      conversationId: raw.conversationId,
      senderId: raw.senderId,
      content: raw.content,
      messageType: raw.messageType as MessageType,
      clientMessageId: raw.clientMessageId,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      attachments: (raw.attachments ?? []).map(
        (a: any) =>
          new MessageAttachment({
            id: a.id,
            messageId: a.messageId,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
            createdAt: a.createdAt,
          }),
      ),
    });
  }

  static toPersistence(message: Message): any {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      clientMessageId: message.clientMessageId,
      deletedAt: message.deletedAt,
    };
  }
}
