import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IMessageRepository,
  MessagePage,
} from '@/modules/chat/domain/repositories/message.repository';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessagePrismaRepository } from '@/modules/chat/infrastructure/persistence/prisma/message-prisma.repository';
import { MessageMapper } from '@/modules/chat/infrastructure/persistence/mappers/message.mapper';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class MessageInfraRepository implements IMessageRepository {
  constructor(private readonly messagePrisma: MessagePrismaRepository) {}

  async findById(id: string): Promise<Message | null> {
    const raw = await this.messagePrisma.findById(id);
    return MessageMapper.toDomain(raw);
  }

  async findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null> {
    const raw = await this.messagePrisma.findByConversationIdAndClientMessageId(
      conversationId,
      clientMessageId,
    );
    return MessageMapper.toDomain(raw);
  }

  async create(message: Message): Promise<Message> {
    const data = MessageMapper.toPersistence(message);
    const attachmentsData = message.attachments.map((a) => ({
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
    }));

    try {
      const raw = await this.messagePrisma.create(data, attachmentsData);
      return MessageMapper.toDomain(raw)!;
    } catch (error) {
      // CreateMessageHandler already checks findByClientMessageId before
      // calling this — this only fires when two concurrent sends (a WS
      // reconnect racing a REST retry, e.g.) both passed that check before
      // either write landed. The unique index on (conversationId,
      // clientMessageId) is the real guard; mirrors
      // ConversationInfraRepository.findOrCreateForApplication's handling
      // of the analogous applicationId race.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        const existing =
          await this.messagePrisma.findByConversationIdAndClientMessageId(
            message.conversationId,
            message.clientMessageId,
          );
        if (existing) return MessageMapper.toDomain(existing)!;
      }
      throw error;
    }
  }

  async update(message: Message): Promise<Message> {
    // Only content/messageType/deletedAt are ever mutated post-creation.
    const raw = await this.messagePrisma.update(message.id, {
      content: message.content,
      messageType: message.messageType,
      deletedAt: message.deletedAt,
    });
    return MessageMapper.toDomain(raw)!;
  }

  async findPage(
    conversationId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<MessagePage> {
    const raws = await this.messagePrisma.findPage(
      conversationId,
      cursor,
      limit,
    );
    const items = raws.map((r) => MessageMapper.toDomain(r)!).reverse();
    const nextCursor = raws.length === limit ? raws[raws.length - 1].id : null;
    return { items, nextCursor };
  }

  async findLastMessage(conversationId: string): Promise<Message | null> {
    const raw = await this.messagePrisma.findLastMessage(conversationId);
    return MessageMapper.toDomain(raw);
  }

  async countUnread(
    conversationId: string,
    userId: string,
    since: Date | null,
  ): Promise<number> {
    return this.messagePrisma.countUnread(conversationId, userId, since);
  }
}
