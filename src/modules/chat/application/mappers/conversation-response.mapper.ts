import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import {
  ConversationResponseDto,
  ConversationParticipantDto,
} from '@/modules/chat/application/dto/conversation-response.dto';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { ChatUserLookupResult } from '@/modules/chat/application/ports/user-lookup.port';

export interface ConversationDtoContext {
  jobTitle: string;
  applicationStatus: string;
  otherParticipant: ChatUserLookupResult;
  lastMessage: Message | null;
  unreadCount: number;
}

export class ConversationResponseMapper {
  static toDto(
    conversation: Conversation,
    ctx: ConversationDtoContext,
  ): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    dto.id = conversation.id;
    dto.status = conversation.status;
    dto.jobId = conversation.jobId;
    dto.jobTitle = ctx.jobTitle;
    dto.applicationId = conversation.applicationId;
    dto.applicationStatus = ctx.applicationStatus;
    dto.candidateId = conversation.candidateId;
    dto.recruiterId = conversation.recruiterId;

    const participantDto = new ConversationParticipantDto();
    participantDto.id = ctx.otherParticipant.id;
    participantDto.fullName = ctx.otherParticipant.fullName;
    participantDto.avatarUrl = ctx.otherParticipant.avatarUrl;
    participantDto.role = ctx.otherParticipant.role;
    dto.otherParticipant = participantDto;

    dto.lastMessage = ctx.lastMessage
      ? MessageResponseMapper.toDto(ctx.lastMessage)
      : null;
    dto.unreadCount = ctx.unreadCount;
    dto.lastMessageAt = conversation.lastMessageAt;
    dto.createdAt = conversation.createdAt;
    return dto;
  }
}
