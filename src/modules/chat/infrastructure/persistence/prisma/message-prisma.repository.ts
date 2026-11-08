import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  /**
   * Creates the message and bumps the parent conversation's
   * `lastMessageAt` to the message's own (DB-assigned) `createdAt` in one
   * transaction, so the two can never fall out of sync on a partial
   * failure.
   */
  async createAndTouchConversation(
    data: Prisma.MessageUncheckedCreateInput,
    attachmentsData: Prisma.MessageAttachmentUncheckedCreateWithoutMessageInput[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          ...data,
          attachments: attachmentsData.length
            ? { create: attachmentsData }
            : undefined,
        },
        include: { attachments: true },
      });
      await tx.conversation.update({
        where: { id: message.conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      return message;
    });
  }

  async update(id: string, data: Prisma.MessageUncheckedUpdateInput) {
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
        // A message its sender took back is no longer something to read.
        deletedAt: null,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }

  /**
   * Total unread across every conversation the user is a member of, in two
   * queries: their memberships (each with its own `lastReadAt`), then one
   * count over all of them.
   */
  async countUnreadForUser(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });
    if (memberships.length === 0) return 0;

    return this.prisma.message.count({
      where: {
        senderId: { not: userId },
        deletedAt: null,
        OR: memberships.map(({ conversationId, lastReadAt }) => ({
          conversationId,
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        })),
      },
    });
  }

  /** One row per conversationId — the newest message in it, via Postgres `DISTINCT ON`. */
  async findLastMessages(conversationIds: string[]) {
    if (conversationIds.length === 0) return [];
    return this.prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      include: { attachments: true },
      orderBy: [{ conversationId: 'asc' }, { createdAt: 'desc' }],
      distinct: ['conversationId'],
    });
  }

  /** One grouped query for all conversations, each with its own `since` threshold. */
  async countUnreadForConversations(
    items: { conversationId: string; since: Date | null }[],
    userId: string,
  ) {
    if (items.length === 0) return [];
    return this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        senderId: { not: userId },
        deletedAt: null,
        OR: items.map(({ conversationId, since }) => ({
          conversationId,
          ...(since ? { createdAt: { gt: since } } : {}),
        })),
      },
      _count: { _all: true },
    });
  }
}
