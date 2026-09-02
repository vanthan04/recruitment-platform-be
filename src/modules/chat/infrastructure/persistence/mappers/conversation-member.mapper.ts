import { ConversationMember } from '@/modules/chat/domain/entities/conversation-member.entity';
import { ChatParticipantRole } from '@/modules/chat/domain/value-objects/chat-participant-role.vo';

export class ConversationMemberMapper {
  static toDomain(raw: any): ConversationMember | null {
    if (!raw) return null;

    return new ConversationMember({
      id: raw.id,
      conversationId: raw.conversationId,
      userId: raw.userId,
      role: raw.role as ChatParticipantRole,
      joinedAt: raw.joinedAt,
      lastReadAt: raw.lastReadAt,
    });
  }

  static toPersistence(member: ConversationMember): any {
    return {
      id: member.id,
      conversationId: member.conversationId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      lastReadAt: member.lastReadAt,
    };
  }
}
