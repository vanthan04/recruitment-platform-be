import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IConversationRepository,
  ConversationListRow,
} from '@/modules/chat/domain/repositories/conversation.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationMember } from '@/modules/chat/domain/entities/conversation-member.entity';
import { ConversationPrismaRepository } from '@/modules/chat/infrastructure/persistence/prisma/conversation-prisma.repository';
import { ConversationMapper } from '@/modules/chat/infrastructure/persistence/mappers/conversation.mapper';
import { ConversationMemberMapper } from '@/modules/chat/infrastructure/persistence/mappers/conversation-member.mapper';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class ConversationInfraRepository implements IConversationRepository {
  constructor(
    private readonly conversationPrisma: ConversationPrismaRepository,
  ) {}

  async findById(id: string): Promise<Conversation | null> {
    const raw = await this.conversationPrisma.findById(id);
    return ConversationMapper.toDomain(raw);
  }

  async findByApplicationId(
    applicationId: string,
  ): Promise<Conversation | null> {
    const raw =
      await this.conversationPrisma.findByApplicationId(applicationId);
    return ConversationMapper.toDomain(raw);
  }

  async findOrCreateForApplication(
    conversation: Conversation,
    members: ConversationMember[],
  ): Promise<{ conversation: Conversation; created: boolean }> {
    const existing = await this.conversationPrisma.findByApplicationId(
      conversation.applicationId,
    );
    if (existing) {
      return {
        conversation: ConversationMapper.toDomain(existing)!,
        created: false,
      };
    }

    try {
      const raw = await this.conversationPrisma.createWithMembers(
        ConversationMapper.toPersistence(conversation),
        // `conversationId` is supplied implicitly by the nested `create` (it's
        // the relation being written through) — Prisma rejects it if present,
        // so this is built directly rather than via the mapper.
        members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          lastReadAt: m.lastReadAt,
        })),
      );
      return { conversation: ConversationMapper.toDomain(raw)!, created: true };
    } catch (error) {
      // Two concurrent requests both passed the findByApplicationId check above —
      // the DB's unique constraint on applicationId is the real guard here.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        const raw = await this.conversationPrisma.findByApplicationId(
          conversation.applicationId,
        );
        return {
          conversation: ConversationMapper.toDomain(raw)!,
          created: false,
        };
      }
      throw error;
    }
  }

  async findManyForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ConversationListRow[]; total: number }> {
    const skip = (page - 1) * limit;
    const { conversations, total } =
      await this.conversationPrisma.findManyForUser(userId, skip, limit);

    const items: ConversationListRow[] = conversations.map((raw: any) => ({
      conversation: ConversationMapper.toDomain(raw)!,
      membership: ConversationMemberMapper.toDomain(raw.members[0])!,
    }));

    return { items, total };
  }

  async findMembership(
    conversationId: string,
    userId: string,
  ): Promise<ConversationMember | null> {
    const raw = await this.conversationPrisma.findMembership(
      conversationId,
      userId,
    );
    return ConversationMemberMapper.toDomain(raw);
  }

  async markMemberRead(
    conversationId: string,
    userId: string,
    at: Date,
  ): Promise<void> {
    await this.conversationPrisma.markMemberRead(conversationId, userId, at);
  }

  async touchLastMessageAt(conversationId: string, at: Date): Promise<void> {
    await this.conversationPrisma.touchLastMessageAt(conversationId, at);
  }
}
