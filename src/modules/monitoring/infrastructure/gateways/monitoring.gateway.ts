import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { DomainException } from '@/common/exceptions/domain.exception';
import { IDetectionServicePort } from '@/modules/monitoring/application/ports/detection-service.port';
import type { FrameDetectionResult } from '@/modules/monitoring/application/ports/detection-service.port';
import { isJpeg } from '@/modules/monitoring/infrastructure/frame.util';
import { MonitoringEventTracker } from '@/modules/monitoring/application/services/monitoring-event-tracker.service';
import { CURRENT_MONITORING_NOTICE_VERSION } from '@/modules/monitoring/domain/monitoring-notice';
import { MonitorStartWsDto } from '@/modules/monitoring/presentation/dtos/monitor-ws.dto';
import {
  MonitoringConsentResult,
  RecordMonitoringConsentCommand,
} from '@/modules/interview/application/commands/record-monitoring-consent.command';
import {
  INTERVIEW_ROOM_CLOSED_EVENT,
  InterviewRoomClosedEvent,
} from '@/modules/interview/infrastructure/events/interview-room-closed.event';
// Same cookie-based handshake auth and error hygiene as the chat and room sockets.
import { authenticateSocket } from '@/modules/chat/infrastructure/gateways/ws-auth.util';
import {
  getSafeErrorMessage,
  validateWsPayload,
} from '@/modules/chat/infrastructure/gateways/ws-validate.util';
import {
  USER_SESSION_REVOKED_EVENT,
  UserSessionRevokedEvent,
} from '@/modules/user/infrastructure/events/user-session-revoked.event';

interface MonitorSocketData {
  userId: string;
  interviewId?: string;
  sessionId?: string;
  lastFrameAt?: number;
  inFlight?: boolean;
}
type MonitorSocket = Socket<any, any, any, MonitorSocketData>;

export const MONITOR_NAMESPACE = '/monitor';
const userRoom = (userId: string) => `user:${userId}`;
export const monitorRoom = (interviewId: string) => `monitor:${interviewId}`;

export type MonitorStartAck =
  | {
      ok: true;
      sessionId: string;
      consentedAt: string;
      maxFrameBytes: number;
      minFrameIntervalMs: number;
    }
  | { ok: false; code: string; message: string };

export type MonitorFrameAck =
  | { ok: true; data: FrameDetectionResult }
  | { ok: false; code: MonitorFrameErrorCode };

export type MonitorFrameErrorCode =
  | 'NOT_STARTED'
  | 'INVALID_FRAME'
  | 'FRAME_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'BUSY'
  | 'AI_BUSY'
  | 'AI_UNAVAILABLE'
  | 'AI_REJECTED';

/**
 * Candidate-side AI monitoring (Phase 3): the browser samples its own webcam
 * and sends one JPEG at a time; this gateway checks it and forwards it to the
 * AI service, answering with the detections in the ack. Nothing is stored here
 * — no frames, no results (event persistence is Phase 4).
 *
 * Guarantees: only the candidate of an interview held in the platform room,
 * with an open session, after their consent has been recorded
 * (RecordMonitoringConsentCommand); at most one frame in flight per socket,
 * no faster than MONITORING_MIN_FRAME_INTERVAL_MS, JPEG only, size-capped.
 * Every failure is a per-frame "drop", never an error for the call itself.
 *
 * Client → server (all with ack): `monitor:start {interviewId, noticeVersion}`,
 * `monitor:frame <binary JPEG>`, `monitor:stop`.
 * Server → client: `monitor:stopped {interviewId, reason}` when the session ends.
 */
@WebSocketGateway({ namespace: MONITOR_NAMESPACE })
export class MonitoringGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);
  private readonly maxFrameBytes: number;
  private readonly minFrameIntervalMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus,
    private readonly detection: IDetectionServicePort,
    private readonly tracker: MonitoringEventTracker,
    config: ConfigService,
  ) {
    this.maxFrameBytes = config.get<number>(
      'MONITORING_MAX_FRAME_BYTES',
      524_288,
    );
    this.minFrameIntervalMs = config.get<number>(
      'MONITORING_MIN_FRAME_INTERVAL_MS',
      500,
    );
  }

  async handleConnection(client: MonitorSocket): Promise<void> {
    try {
      const auth = await authenticateSocket(
        this.jwtService,
        client.handshake.headers.cookie,
      );
      client.data.userId = auth.id;
      await client.join(userRoom(auth.id));
    } catch (error) {
      this.logger.debug(
        `Monitor handshake rejected: ${(error as Error).message}`,
      );
      client.emit('monitor:error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @OnEvent(USER_SESSION_REVOKED_EVENT)
  handleSessionRevoked(event: UserSessionRevokedEvent): void {
    this.server.in(userRoom(event.userId)).disconnectSockets(true);
  }

  /** The session ended (or the interview finished): stop analysing immediately. */
  @OnEvent(INTERVIEW_ROOM_CLOSED_EVENT)
  handleRoomClosed(event: InterviewRoomClosedEvent): void {
    const room = monitorRoom(event.interviewId);
    this.server.in(room).emit('monitor:stopped', {
      interviewId: event.interviewId,
      reason: 'session-ended',
    });
    this.server.in(room).socketsLeave(room);
    this.background(
      this.tracker.stopInterview(event.interviewId, 'session-ended'),
    );
  }

  @SubscribeMessage('monitor:start')
  async onStart(
    @ConnectedSocket() client: MonitorSocket,
    @MessageBody() rawData: unknown,
  ): Promise<MonitorStartAck> {
    try {
      const { interviewId, noticeVersion } = await validateWsPayload(
        MonitorStartWsDto,
        rawData,
      );
      // A client still showing an older notice must not be monitored under
      // terms the candidate wasn't shown (e.g. events now being stored).
      if (noticeVersion !== CURRENT_MONITORING_NOTICE_VERSION) {
        return {
          ok: false,
          code: 'NOTICE_OUTDATED',
          message: 'The monitoring notice has changed — reload the page',
        };
      }
      if (!this.detection.isConfigured()) {
        return {
          ok: false,
          code: 'AI_UNAVAILABLE',
          message: 'AI monitoring is not available right now',
        };
      }

      // Authorization + persisted consent, before any frame is accepted.
      const consent: MonitoringConsentResult = await this.commandBus.execute(
        new RecordMonitoringConsentCommand(
          client.data.userId,
          interviewId,
          noticeVersion,
        ),
      );

      // Re-starting the same session (e.g. a repeated start) keeps its open
      // events; switching to another session ends the previous one's.
      this.leaveCurrent(client, client.data.sessionId !== consent.sessionId);
      client.data.interviewId = interviewId;
      client.data.sessionId = consent.sessionId;
      client.data.lastFrameAt = undefined;
      client.data.inFlight = false;
      await client.join(monitorRoom(interviewId));

      return {
        ok: true,
        sessionId: consent.sessionId,
        consentedAt: consent.consentedAt.toISOString(),
        maxFrameBytes: this.maxFrameBytes,
        minFrameIntervalMs: this.minFrameIntervalMs,
      };
    } catch (error) {
      this.logger.debug(`monitor:start refused: ${(error as Error).message}`);
      return {
        ok: false,
        code: error instanceof DomainException ? error.code : 'START_REFUSED',
        message: getSafeErrorMessage(error),
      };
    }
  }

  @SubscribeMessage('monitor:frame')
  async onFrame(
    @ConnectedSocket() client: MonitorSocket,
    @MessageBody() frame: unknown,
  ): Promise<MonitorFrameAck> {
    const interviewId = client.data.interviewId;
    // Room membership is the authority: it is dropped when the session ends.
    if (!interviewId || !client.rooms.has(monitorRoom(interviewId))) {
      return { ok: false, code: 'NOT_STARTED' };
    }
    if (!Buffer.isBuffer(frame)) return { ok: false, code: 'INVALID_FRAME' };
    if (frame.length > this.maxFrameBytes) {
      return { ok: false, code: 'FRAME_TOO_LARGE' };
    }
    if (!isJpeg(frame)) return { ok: false, code: 'INVALID_FRAME' };
    // One frame at a time per socket — never an unbounded queue.
    if (client.data.inFlight) return { ok: false, code: 'BUSY' };
    const now = Date.now();
    if (
      client.data.lastFrameAt !== undefined &&
      now - client.data.lastFrameAt < this.minFrameIntervalMs
    ) {
      return { ok: false, code: 'RATE_LIMITED' };
    }

    client.data.lastFrameAt = now;
    client.data.inFlight = true;
    try {
      const outcome = await this.detection.detectFrame(frame);
      switch (outcome.status) {
        case 'ok':
          // Event rules + persistence run server-side, whether or not any
          // dashboard is watching; they never delay or fail this frame.
          this.background(
            this.tracker.observe(
              client.data.sessionId!,
              interviewId,
              outcome.result.detections,
              new Date(now),
            ),
          );
          return { ok: true, data: outcome.result };
        case 'busy':
          return { ok: false, code: 'AI_BUSY' };
        case 'rejected':
          return { ok: false, code: 'AI_REJECTED' };
        case 'unavailable':
        default:
          return { ok: false, code: 'AI_UNAVAILABLE' };
      }
    } catch (error) {
      this.logger.error(`Frame detection failed: ${(error as Error).message}`);
      return { ok: false, code: 'AI_UNAVAILABLE' };
    } finally {
      client.data.inFlight = false;
    }
  }

  @SubscribeMessage('monitor:stop')
  onStop(@ConnectedSocket() client: MonitorSocket): { ok: true } {
    this.leaveCurrent(client, true);
    return { ok: true };
  }

  private leaveCurrent(client: MonitorSocket, stopTracking: boolean): void {
    const interviewId = client.data?.interviewId;
    const sessionId = client.data?.sessionId;
    if (interviewId) void client.leave(monitorRoom(interviewId));
    if (stopTracking && sessionId) {
      this.background(this.tracker.stop(sessionId, 'monitoring-stopped'));
    }
    client.data.interviewId = undefined;
    client.data.sessionId = undefined;
    client.data.lastFrameAt = undefined;
    client.data.inFlight = false;
  }

  private background(work: Promise<unknown>): void {
    work.catch((error: unknown) =>
      this.logger.error(
        `Monitoring event tracking failed: ${(error as Error).message}`,
      ),
    );
  }
}
