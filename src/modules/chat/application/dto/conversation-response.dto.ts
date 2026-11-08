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
  /** True once the application ended (REJECTED/WITHDRAWN): readable, but no new or edited messages. */
  isReadOnly: boolean;
  candidateId: string;
  recruiterId: string;
  otherParticipant: ConversationParticipantDto;
  lastMessage: MessageResponseDto | null;
  unreadCount: number;
  /** When the other participant last read this conversation — null if never. */
  otherLastReadAt: Date | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}
