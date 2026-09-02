import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';

export class MessageAttachmentResponseDto {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export class MessageResponseDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  clientMessageId: string;
  isDeleted: boolean;
  attachments: MessageAttachmentResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class MessagePageResponseDto {
  items: MessageResponseDto[];
  nextCursor: string | null;
}
