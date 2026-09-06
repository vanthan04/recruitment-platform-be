import { Prisma, Conversation as PrismaConversation } from '@prisma/client';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationStatus } from '@/modules/chat/domain/value-objects/conversation-status.vo';

type ConversationWithMembers = Prisma.ConversationGetPayload<{
  include: { members: true };
}>;

export class ConversationMapper {
  static toDomain(
    raw: PrismaConversation | ConversationWithMembers | null,
  ): Conversation | null {
    if (!raw) return null;

    return new Conversation({
      id: raw.id,
      jobId: raw.jobId,
      applicationId: raw.applicationId,
      candidateId: raw.candidateId,
      recruiterId: raw.recruiterId,
      status: raw.status as ConversationStatus,
      lastMessageAt: raw.lastMessageAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(
    conversation: Conversation,
  ): Prisma.ConversationUncheckedCreateInput {
    return {
      id: conversation.id,
      jobId: conversation.jobId,
      applicationId: conversation.applicationId,
      candidateId: conversation.candidateId,
      recruiterId: conversation.recruiterId,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
    };
  }
}
