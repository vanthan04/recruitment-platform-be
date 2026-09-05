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
import {
  validateWsPayload,
  getSafeErrorMessage,
} from '@/modules/chat/infrastructure/gateways/ws-validate.util';
import {
  ConversationIdWsDto,
  SendMessageWsDto,
} from '@/modules/chat/presentation/dtos/ws-payloads.dto';
import { CreateMessageCommand } from '@/modules/chat/application/commands/create-message.command';
import { MarkConversationReadCommand } from '@/modules/chat/application/commands/mark-conversation-read.command';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import {
  USER_SESSION_REVOKED_EVENT,
  UserSessionRevokedEvent,
} from '@/modules/user/infrastructure/events/user-session-revoked.event';

const userRoom = (userId: string) => `user:${userId}`;
const conversationRoom = (conversationId: string) =>
  `conversation:${conversationId}`;

const SEND_RATE_LIMIT = 20;
const SEND_RATE_WINDOW_MS = 10_000;
const READ_RATE_LIMIT = 30;
const READ_RATE_WINDOW_MS = 10_000;

@WebSocketGateway({ namespace: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // Sliding-window limiters keyed by userId, not socket id — a socket id
  // resets on every reconnect, which would otherwise let a client bypass
  // the limit just by reconnecting. @nestjs/throttler isn't wired to
  // gateways, so this is additive coverage.
  private readonly sendTimestamps = new Map<string, number[]>();
  private readonly readTimestamps = new Map<string, number[]>();

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
    // The rate-limit maps are keyed by userId (not this socket's id) so a
    // reconnect can't reset a user's quota — nothing to clean up per-socket
    // here; a user's entry is naturally bounded (one per distinct user who
    // has ever sent/read) and its own timestamps age out via consumeQuota's
    // sliding-window filter regardless of connection state.
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

  /**
   * Logout, logout-all, or an admin blocking the account all end up here —
   * a standing WS connection never makes a REST call that would naturally
   * re-check anything, so this is the only way a revoked session's chat
   * access actually ends before the socket happens to disconnect on its own.
   */
  @OnEvent(USER_SESSION_REVOKED_EVENT)
  handleSessionRevoked(event: UserSessionRevokedEvent): void {
    this.server.in(userRoom(event.userId)).disconnectSockets(true);
  }

  @SubscribeMessage('conversation:subscribe')
  async onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    const userId = client.data.userId as string;
    if (!this.consumeQuota(this.readTimestamps, userId, READ_RATE_LIMIT, READ_RATE_WINDOW_MS)) {
      client.emit('error', { message: 'Too many requests — slow down' });
      return;
    }

    try {
      const data = await validateWsPayload(ConversationIdWsDto, rawData);
      const conversation = await this.conversationRepository.findById(
        data.conversationId,
      );
      if (!conversation || !conversation.isMember(userId)) {
        client.emit('error', { message: 'Not a member of this conversation' });
        return;
      }
      await client.join(conversationRoom(data.conversationId));
    } catch (error) {
      client.emit('error', { message: getSafeErrorMessage(error) });
    }
  }

  @SubscribeMessage('conversation:unsubscribe')
  async onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    try {
      const data = await validateWsPayload(ConversationIdWsDto, rawData);
      void client.leave(conversationRoom(data.conversationId));
    } catch (error) {
      client.emit('error', { message: getSafeErrorMessage(error) });
    }
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    const userId = client.data.userId as string;

    if (!this.consumeQuota(this.sendTimestamps, userId, SEND_RATE_LIMIT, SEND_RATE_WINDOW_MS)) {
      const clientMessageId =
        rawData && typeof rawData === 'object'
          ? (rawData as Record<string, unknown>).clientMessageId
          : undefined;
      client.emit('message:error', {
        clientMessageId,
        message: 'Too many messages — slow down',
      });
      return;
    }

    let data: SendMessageWsDto | undefined;
    try {
      data = await validateWsPayload(SendMessageWsDto, rawData);

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
          data.messageType,
          data.attachments ?? [],
        ),
      );

      client.emit('message:ack', {
        clientMessageId: data.clientMessageId,
        message,
      });
    } catch (error) {
      client.emit('message:error', {
        clientMessageId: data?.clientMessageId,
        message: getSafeErrorMessage(error),
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
    @MessageBody() rawData: unknown,
  ) {
    const userId = client.data.userId as string;
    if (!this.consumeQuota(this.readTimestamps, userId, READ_RATE_LIMIT, READ_RATE_WINDOW_MS)) {
      client.emit('error', { message: 'Too many requests — slow down' });
      return;
    }

    try {
      const data = await validateWsPayload(ConversationIdWsDto, rawData);
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
      client.emit('error', { message: getSafeErrorMessage(error) });
    }
  }

  @SubscribeMessage('typing:start')
  async onTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    await this.broadcastTyping(client, rawData, 'typing:start');
  }

  @SubscribeMessage('typing:stop')
  async onTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    await this.broadcastTyping(client, rawData, 'typing:stop');
  }

  private async broadcastTyping(
    client: Socket,
    rawData: unknown,
    event: 'typing:start' | 'typing:stop',
  ): Promise<void> {
    const userId = client.data.userId as string;
    try {
      const data = await validateWsPayload(ConversationIdWsDto, rawData);
      // Unlike message:send/message:read, a bad typing:* event isn't worth
      // reporting back to the client — just drop it silently on failure.
      const conversation = await this.conversationRepository.findById(
        data.conversationId,
      );
      if (!conversation || !conversation.isMember(userId)) return;

      client.to(conversationRoom(data.conversationId)).emit(event, {
        conversationId: data.conversationId,
        userId,
      });
    } catch {
      // no-op — see comment above
    }
  }

  /** Sliding-window limiter. Returns false (and does not consume) once the caller is over budget. */
  private consumeQuota(
    store: Map<string, number[]>,
    key: string,
    limit: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const timestamps = (store.get(key) ?? []).filter(
      (t) => now - t < windowMs,
    );
    timestamps.push(now);
    store.set(key, timestamps);
    return timestamps.length <= limit;
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
