import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class MessagePrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: { attachments: true },
    });
  }

  async findByConversationIdAndClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ) {
    return this.prisma.message.findUnique({
      where: {
        conversationId_clientMessageId: { conversationId, clientMessageId },
      },
      include: { attachments: true },
    });
  }

  async create(data: any, attachmentsData: any[]) {
    return this.prisma.message.create({
      data: {
        ...data,
        attachments: attachmentsData.length
          ? { create: attachmentsData }
          : undefined,
      },
      include: { attachments: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.message.update({
      where: { id },
      data,
      include: { attachments: true },
    });
  }

  /** Returns rows newest-first (descending `createdAt`), length <= limit. */
  async findPage(
    conversationId: string,
    cursorMessageId: string | undefined,
    limit: number,
  ) {
    const cursorMessage = cursorMessageId
      ? await this.prisma.message.findUnique({ where: { id: cursorMessageId } })
      : null;

    return this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorMessage
          ? { createdAt: { lt: cursorMessage.createdAt } }
          : {}),
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findLastMessage(conversationId: string) {
    return this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true },
    });
  }

  async countUnread(
    conversationId: string,
    userId: string,
    since: Date | null,
  ) {
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }
}
