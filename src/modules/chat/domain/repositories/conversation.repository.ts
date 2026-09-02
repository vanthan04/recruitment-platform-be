import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationMember } from '@/modules/chat/domain/entities/conversation-member.entity';

export interface ConversationListRow {
  conversation: Conversation;
  membership: ConversationMember;
}

export abstract class IConversationRepository {
  abstract findById(id: string): Promise<Conversation | null>;
  abstract findByApplicationId(
    applicationId: string,
  ): Promise<Conversation | null>;

  /**
   * Idempotent, race-safe find-or-create keyed by the unique `applicationId`.
   * Implemented as a single Prisma `upsert` — never "check then create".
   */
  abstract findOrCreateForApplication(
    conversation: Conversation,
    members: ConversationMember[],
  ): Promise<{ conversation: Conversation; created: boolean }>;

  abstract findManyForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ConversationListRow[]; total: number }>;

  abstract findMembership(
    conversationId: string,
    userId: string,
  ): Promise<ConversationMember | null>;
  abstract markMemberRead(
    conversationId: string,
    userId: string,
    at: Date,
  ): Promise<void>;
  abstract touchLastMessageAt(conversationId: string, at: Date): Promise<void>;
}
