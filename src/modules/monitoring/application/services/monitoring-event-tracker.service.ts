import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';
import {
  EventEndReason,
  EventTransition,
  MonitoringEventType,
  ObservedDetection,
  SessionEventRules,
} from '@/modules/monitoring/domain/services/event-rules';

interface SessionTracking {
  interviewId: string;
  rules: SessionEventRules;
  openEventIds: Map<MonitoringEventType, string>;
  lastFrameAt: number;
  /** Serializes persistence per session, so an end never overtakes its begin. */
  chain: Promise<void>;
}

const SWEEP_INTERVAL_MS = 5_000;

/**
 * Feeds analysed frames into the per-session event rules and persists what
 * begins and ends. Lives server-side, so events are recorded whether or not
 * any dashboard is watching. Persistence failures are logged and never reach
 * the frame pipeline. Sessions that stop sending frames (closed tab, lost
 * network) have their open events ended after MONITORING_EVENT_STALE_MS.
 *
 * In-memory per process, matching the single-instance deployment (see
 * CLAUDE.md). After a restart, events that were open stay open-ended (endedAt null).
 */
@Injectable()
export class MonitoringEventTracker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringEventTracker.name);
  private readonly sessions = new Map<string, SessionTracking>();
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  private readonly minConfidence: number;
  private readonly startFrames: number;
  private readonly endFrames: number;
  private readonly cooldownMs: number;
  private readonly staleMs: number;

  constructor(
    private readonly repository: IDetectionEventRepository,
    config: ConfigService,
  ) {
    this.minConfidence = config.get<number>(
      'MONITORING_EVENT_MIN_CONFIDENCE',
      0.5,
    );
    this.startFrames = config.get<number>('MONITORING_EVENT_START_FRAMES', 3);
    this.endFrames = config.get<number>('MONITORING_EVENT_END_FRAMES', 3);
    this.cooldownMs = config.get<number>(
      'MONITORING_EVENT_COOLDOWN_MS',
      30_000,
    );
    this.staleMs = config.get<number>('MONITORING_EVENT_STALE_MS', 15_000);
  }

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    await Promise.all(
      [...this.sessions.keys()].map((id) => this.stop(id, 'server-shutdown')),
    );
  }

  /** One analysed frame for a session. Resolves once its events are persisted. */
  observe(
    sessionId: string,
    interviewId: string,
    detections: ObservedDetection[],
    at: Date = new Date(),
  ): Promise<void> {
    let tracking = this.sessions.get(sessionId);
    if (!tracking) {
      tracking = {
        interviewId,
        rules: new SessionEventRules({
          minConfidence: this.minConfidence,
          startFrames: this.startFrames,
          endFrames: this.endFrames,
          cooldownMs: this.cooldownMs,
        }),
        openEventIds: new Map(),
        lastFrameAt: at.getTime(),
        chain: Promise.resolve(),
      };
      this.sessions.set(sessionId, tracking);
    }
    tracking.lastFrameAt = at.getTime();
    return this.persist(
      sessionId,
      tracking,
      tracking.rules.observe(detections, at),
    );
  }

  /** Monitoring stopped for this session: end whatever is open. */
  async stop(
    sessionId: string,
    reason: EventEndReason,
    at: Date = new Date(),
  ): Promise<void> {
    const tracking = this.sessions.get(sessionId);
    if (!tracking) return;
    this.sessions.delete(sessionId);
    await this.persist(
      sessionId,
      tracking,
      tracking.rules.closeAll(at, reason),
    );
  }

  /** The interview's session ended: stop every session tracked for it. */
  async stopInterview(
    interviewId: string,
    reason: EventEndReason,
  ): Promise<void> {
    const ids = [...this.sessions.entries()]
      .filter(([, t]) => t.interviewId === interviewId)
      .map(([id]) => id);
    await Promise.all(ids.map((id) => this.stop(id, reason)));
  }

  /** Ends events of sessions that have stopped sending frames. */
  sweep(now: number = Date.now()): Promise<void[]> {
    const stale = [...this.sessions.entries()]
      .filter(([, t]) => now - t.lastFrameAt > this.staleMs)
      .map(([id, t]) => this.stop(id, 'stale', new Date(t.lastFrameAt)));
    return Promise.all(stale);
  }

  private persist(
    sessionId: string,
    tracking: SessionTracking,
    transitions: EventTransition[],
  ): Promise<void> {
    if (transitions.length === 0) return tracking.chain;
    tracking.chain = tracking.chain.then(async () => {
      for (const t of transitions) {
        try {
          if (t.kind === 'begin') {
            const id = await this.repository.create({
              interviewSessionId: sessionId,
              eventType: t.eventType,
              objectClass: t.objectClass,
              confidence: t.confidence,
              detectedAt: t.detectedAt,
              frameCount: t.frameCount,
              metadata: t.metadata,
            });
            tracking.openEventIds.set(t.eventType, id);
          } else {
            const id = tracking.openEventIds.get(t.eventType);
            if (!id) continue; // its begin failed to persist
            tracking.openEventIds.delete(t.eventType);
            await this.repository.close(id, {
              endedAt: t.endedAt,
              confidence: t.confidence,
              frameCount: t.frameCount,
              metadata: t.metadata,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to persist ${t.kind} of ${t.eventType} for session ${sessionId}: ${(error as Error).message}`,
          );
        }
      }
    });
    return tracking.chain;
  }
}
