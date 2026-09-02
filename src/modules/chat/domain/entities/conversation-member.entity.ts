import { ChatParticipantRole } from '@/modules/chat/domain/value-objects/chat-participant-role.vo';

export class ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: ChatParticipantRole;
  joinedAt: Date;
  lastReadAt: Date | null;

  constructor(partial: Partial<ConversationMember>) {
    Object.assign(this, partial);
    this.joinedAt = partial.joinedAt ?? new Date();
    this.lastReadAt = partial.lastReadAt ?? null;
  }

  markRead(at: Date = new Date()): void {
    this.lastReadAt = at;
  }
}
