import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import { authenticateSocket } from '@/modules/chat/infrastructure/gateways/ws-auth.util';
import { CreateMessageCommand } from '@/modules/chat/application/commands/create-message.command';
import { MarkConversationReadCommand } from '@/modules/chat/application/commands/mark-conversation-read.command';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { CreateMessageAttachmentInput } from '@/modules/chat/application/commands/create-message.command';
import { MESSAGE_SENT_EVENT, MessageSentEvent } from '@/modules/chat/infrastructure/events/message-sent.event';

interface SendMessagePayload {
  conversationId: string;
  clientMessageId: string;
  content: string;
  messageType?: MessageType;
  attachments?: CreateMessageAttachmentInput[];
}

const userRoom = (userId: string) => `user:${userId}`;
const conversationRoom = (conversationId: string) =>
  `conversation:${conversationId}`;

const SEND_RATE_LIMIT = 20;
const SEND_RATE_WINDOW_MS = 10_000;

@WebSocketGateway({ namespace: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly sendTimestamps = new Map<string, number[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus,
    private readonly conversationRepository: IConversationRepository,
    private readonly presenceService: ChatPresenceService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const auth = await authenticateSocket(
        this.jwtService,
        client.handshake.headers.cookie,
      );
      client.data.userId = auth.id;
      client.data.role = auth.role;

      await client.join(userRoom(auth.id));

      const justCameOnline = this.presenceService.addSocket(auth.id, client.id);
      if (justCameOnline) {
        await this.broadcastPresence(auth.id, 'user:online');
      }
    } catch (error) {
      this.logger.debug(`WS handshake rejected: ${(error as Error).message}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.sendTimestamps.delete(client.id);
    const userId = client.data?.userId;
    if (!userId) return;

    const justWentOffline = this.presenceService.removeSocket(
      userId,
      client.id,
    );
    if (justWentOffline) {
      await this.broadcastPresence(userId, 'user:offline');
    }
  }

  @SubscribeMessage('conversation:subscribe')
  async onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const conversation = await this.conversationRepository.findById(
      data.conversationId,
    );
    if (!conversation || !conversation.isMember(client.data.userId)) {
      client.emit('error', { message: 'Not a member of this conversation' });
      return;
    }
    await client.join(conversationRoom(data.conversationId));
  }

  @SubscribeMessage('conversation:unsubscribe')
  onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    void client.leave(conversationRoom(data.conversationId));
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload,
  ) {
    const userId = client.data.userId as string;

    if (!this.consumeSendQuota(client.id)) {
      client.emit('message:error', {
        clientMessageId: data.clientMessageId,
        message: 'Too many messages — slow down',
      });
      return;
    }

    try {
      // Broadcasting happens from handleMessageSent below (triggered by the
      // MESSAGE_SENT_EVENT this command emits after persisting) — not here —
      // so a message created via the REST fallback broadcasts identically to
      // one created over this socket. This handler only owns the ack.
      const message = await this.commandBus.execute(
        new CreateMessageCommand(
          userId,
          data.conversationId,
          data.clientMessageId,
          data.content,
          data.messageType ?? MessageType.TEXT,
          data.attachments ?? [],
        ),
      );

      client.emit('message:ack', {
        clientMessageId: data.clientMessageId,
        message,
      });
    } catch (error) {
      client.emit('message:error', {
        clientMessageId: data.clientMessageId,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Fires for every persisted message regardless of transport (REST or this
   * gateway) — the single broadcast path. Targets the conversation room
   * (whoever has it open) plus both participants' personal rooms (so it
   * still reaches someone who has the conversation list open but hasn't
   * subscribed to this specific conversation, and reaches every tab/device
   * of the sender too).
   */
  @OnEvent(MESSAGE_SENT_EVENT)
  handleMessageSent(event: MessageSentEvent): void {
    this.server
      .to(conversationRoom(event.conversationId))
      .to(userRoom(event.senderId))
      .to(userRoom(event.recipientId))
      .emit('message:new', event.message);
  }

  @SubscribeMessage('message:read')
  async onMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string;
    try {
      await this.commandBus.execute(
        new MarkConversationReadCommand(userId, data.conversationId),
      );
      this.server
        .to(conversationRoom(data.conversationId))
        .emit('message:read', {
          conversationId: data.conversationId,
          userId,
          readAt: new Date(),
        });
    } catch (error) {
      client.emit('error', { message: (error as Error).message });
    }
  }

  @SubscribeMessage('typing:start')
  onTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(conversationRoom(data.conversationId)).emit('typing:start', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  onTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(conversationRoom(data.conversationId)).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  /** Sliding-window limiter per socket — @nestjs/throttler isn't wired to gateways, this is additive coverage. */
  private consumeSendQuota(socketId: string): boolean {
    const now = Date.now();
    const timestamps = (this.sendTimestamps.get(socketId) ?? []).filter(
      (t) => now - t < SEND_RATE_WINDOW_MS,
    );
    timestamps.push(now);
    this.sendTimestamps.set(socketId, timestamps);
    return timestamps.length <= SEND_RATE_LIMIT;
  }

  private async broadcastPresence(
    userId: string,
    event: 'user:online' | 'user:offline',
  ) {
    const { items } = await this.conversationRepository.findManyForUser(
      userId,
      1,
      100,
    );
    for (const { conversation } of items) {
      this.server
        .to(userRoom(conversation.otherParticipantId(userId)))
        .emit(event, { userId });
    }
  }
}
