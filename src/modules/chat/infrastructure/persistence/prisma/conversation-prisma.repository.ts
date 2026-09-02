import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class ConversationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  async findByApplicationId(applicationId: string) {
    return this.prisma.conversation.findUnique({ where: { applicationId } });
  }

  async createWithMembers(conversationData: any, membersData: any[]) {
    return this.prisma.conversation.create({
      data: {
        ...conversationData,
        members: { create: membersData },
      },
    });
  }

  async findManyForUser(userId: string, skip: number, take: number) {
    const where = { OR: [{ candidateId: userId }, { recruiterId: userId }] };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: { members: { where: { userId } } },
        orderBy: [
          { lastMessageAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { conversations, total };
  }

  async findMembership(conversationId: string, userId: string) {
    return this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
  }

  async markMemberRead(conversationId: string, userId: string, at: Date) {
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: at },
    });
  }

  async touchLastMessageAt(conversationId: string, at: Date) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: at },
    });
  }
}
