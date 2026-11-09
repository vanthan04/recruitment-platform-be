import { Logger } from '@nestjs/common';
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
import type { RemoteSocket, Server, Socket } from 'socket.io';

import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import {
  InterviewNotFoundException,
  InterviewRoomNotEnabledException,
  InterviewSessionNotOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';
import { RoomJoinWsDto } from '@/modules/interview/presentation/dtos/room-ws-payloads.dto';
import { parseSignalPayload } from '@/modules/interview/infrastructure/rtc/signal.util';
import { SlidingWindowLimiter } from '@/modules/interview/infrastructure/rtc/sliding-window-limiter';
import {
  INTERVIEW_ROOM_CLOSED_EVENT,
  InterviewRoomClosedEvent,
} from '@/modules/interview/infrastructure/events/interview-room-closed.event';
// Same cookie-based handshake auth and error hygiene as the chat socket.
import { authenticateSocket } from '@/modules/chat/infrastructure/gateways/ws-auth.util';
import {
  validateWsPayload,
  getSafeErrorMessage,
} from '@/modules/chat/infrastructure/gateways/ws-validate.util';
import {
  USER_SESSION_REVOKED_EVENT,
  UserSessionRevokedEvent,
} from '@/modules/user/infrastructure/events/user-session-revoked.event';

interface RoomSocketData {
  userId: string;
  role?: 'CANDIDATE' | 'RECRUITER';
  interviewId?: string;
}
type RoomSocket = Socket<any, any, any, RoomSocketData>;

export const RTC_NAMESPACE = '/rtc';
const userRoom = (userId: string) => `user:${userId}`;
export const roomName = (interviewId: string) =>
  `interview-room:${interviewId}`;

// A handshake produces a few dozen ICE candidates; this leaves ample headroom
// for renegotiation while bounding a misbehaving client.
const SIGNAL_LIMIT = 200;
const SIGNAL_WINDOW_MS = 10_000;

/**
 * Signaling for the interview video room (self-hosted WebRTC, see
 * P2pRoomProvider). It only authorizes and relays: media never touches the
 * server. Authorization mirrors the REST side — a socket may enter a room only
 * as the candidate or the job-owning recruiter of that interview, only for an
 * interview that uses the room, and only while a session is open. Because only
 * those two people can pass that check, a room can never hold a third party.
 *
 * Client → server: `room:join {interviewId}`, `rtc:signal {description|candidate}`,
 * `room:leave`. Server → client: `room:joined`, `room:peer-joined`,
 * `room:peer-left`, `rtc:signal {from, ...}`, `room:replaced`, `room:closed`,
 * `room:error`.
 */
@WebSocketGateway({ namespace: RTC_NAMESPACE })
export class InterviewRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(InterviewRoomGateway.name);
  private readonly signalLimiter = new SlidingWindowLimiter(
    SIGNAL_LIMIT,
    SIGNAL_WINDOW_MS,
  );

  constructor(
    private readonly jwtService: JwtService,
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async handleConnection(client: RoomSocket): Promise<void> {
    try {
      const auth = await authenticateSocket(
        this.jwtService,
        client.handshake.headers.cookie,
      );
      client.data.userId = auth.id;
      await client.join(userRoom(auth.id));
    } catch (error) {
      this.logger.debug(`RTC handshake rejected: ${(error as Error).message}`);
      client.emit('room:error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: RoomSocket): void {
    this.leaveCurrentRoom(client);
    this.signalLimiter.clear(client.id);
  }

  /** Logout / admin block: a standing socket makes no REST call that would notice. */
  @OnEvent(USER_SESSION_REVOKED_EVENT)
  handleSessionRevoked(event: UserSessionRevokedEvent): void {
    this.server.in(userRoom(event.userId)).disconnectSockets(true);
  }

  /** Session ended, or the interview finished/cancelled: tell whoever is still connected. */
  @OnEvent(INTERVIEW_ROOM_CLOSED_EVENT)
  handleRoomClosed(event: InterviewRoomClosedEvent): void {
    const room = roomName(event.interviewId);
    this.server.in(room).emit('room:closed', {
      interviewId: event.interviewId,
    });
    this.server.in(room).socketsLeave(room);
  }

  @SubscribeMessage('room:join')
  async onJoin(
    @ConnectedSocket() client: RoomSocket,
    @MessageBody() rawData: unknown,
  ): Promise<void> {
    const userId = client.data.userId;
    try {
      const { interviewId } = await validateWsPayload(RoomJoinWsDto, rawData);

      const item = await this.readRepository.findItemById(interviewId);
      if (!item) throw new InterviewNotFoundException(interviewId);
      const role = resolveInterviewParticipant(item, userId);
      if (!item.interview.useRoom) throw new InterviewRoomNotEnabledException();
      const session =
        await this.sessionRepository.findOpenByInterviewId(interviewId);
      if (!session) throw new InterviewSessionNotOpenException();

      // Re-joining the same room from this socket (or a different one) must not
      // leave a stale presence behind.
      if (client.data.interviewId && client.data.interviewId !== interviewId) {
        this.leaveCurrentRoom(client);
      }

      const room = roomName(interviewId);
      const present = (await this.server
        .in(room)
        .fetchSockets()) as RemoteSocket<any, RoomSocketData>[];

      // One live socket per user: a second tab/device takes over, the first is told.
      for (const other of present) {
        if (other.data.userId === userId && other.id !== client.id) {
          other.emit('room:replaced', { interviewId });
          other.leave(room);
        }
      }
      const peers = present
        .filter((s) => s.data.userId !== userId)
        .map((s) => ({ userId: s.data.userId, role: s.data.role }));

      client.data.interviewId = interviewId;
      client.data.role = role;
      await client.join(room);

      client.emit('room:joined', {
        interviewId,
        sessionId: session.id,
        role,
        peers,
      });
      client.to(room).emit('room:peer-joined', { userId, role });
    } catch (error) {
      this.logger.debug(`room:join rejected: ${(error as Error).message}`);
      client.emit('room:error', { message: getSafeErrorMessage(error) });
    }
  }

  @SubscribeMessage('rtc:signal')
  onSignal(
    @ConnectedSocket() client: RoomSocket,
    @MessageBody() rawData: unknown,
  ): void {
    const interviewId = client.data.interviewId;
    // Authority is socket.io room membership, not anything the client sends:
    // the target room is never taken from the payload.
    if (!interviewId || !client.rooms.has(roomName(interviewId))) {
      client.emit('room:error', { message: 'You are not in a room' });
      return;
    }
    if (!this.signalLimiter.tryConsume(client.id)) {
      client.emit('room:error', { message: 'Too many signals — slow down' });
      return;
    }
    try {
      const payload = parseSignalPayload(rawData);
      client
        .to(roomName(interviewId))
        .emit('rtc:signal', { from: client.data.userId, ...payload });
    } catch (error) {
      client.emit('room:error', { message: getSafeErrorMessage(error) });
    }
  }

  @SubscribeMessage('room:leave')
  onLeave(@ConnectedSocket() client: RoomSocket): void {
    this.leaveCurrentRoom(client);
  }

  private leaveCurrentRoom(client: RoomSocket): void {
    const interviewId = client.data?.interviewId;
    if (!interviewId) return;
    const room = roomName(interviewId);
    if (client.rooms.has(room)) {
      client.to(room).emit('room:peer-left', { userId: client.data.userId });
      void client.leave(room);
    }
    client.data.interviewId = undefined;
    client.data.role = undefined;
  }
}
