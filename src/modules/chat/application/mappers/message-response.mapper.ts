import { Message } from '@/modules/chat/domain/entities/message.entity';
import {
  MessageResponseDto,
  MessageAttachmentResponseDto,
} from '@/modules/chat/application/dto/message-response.dto';

export class MessageResponseMapper {
  static toDto(message: Message): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = message.id;
    dto.conversationId = message.conversationId;
    dto.senderId = message.senderId;
    dto.content = message.displayContent();
    dto.messageType = message.messageType;
    dto.clientMessageId = message.clientMessageId;
    dto.isDeleted = message.isDeleted;
    dto.createdAt = message.createdAt;
    dto.updatedAt = message.updatedAt;
    dto.attachments = message.isDeleted
      ? []
      : message.attachments.map((a) => {
          const attachmentDto = new MessageAttachmentResponseDto();
          attachmentDto.id = a.id;
          attachmentDto.fileName = a.fileName;
          attachmentDto.fileUrl = a.fileUrl;
          attachmentDto.mimeType = a.mimeType;
          attachmentDto.fileSize = a.fileSize;
          return attachmentDto;
        });
    return dto;
  }

  static toDtoList(messages: Message[]): MessageResponseDto[] {
    return messages.map(MessageResponseMapper.toDto);
  }
}
