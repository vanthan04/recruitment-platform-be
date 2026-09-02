import { ConversationStatus } from '@/modules/chat/domain/value-objects/conversation-status.vo';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';

export class ConversationParticipantDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export class ConversationResponseDto {
  id: string;
  status: ConversationStatus;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  applicationStatus: string;
  candidateId: string;
  recruiterId: string;
  otherParticipant: ConversationParticipantDto;
  lastMessage: MessageResponseDto | null;
  unreadCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}
