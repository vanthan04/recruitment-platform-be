import { Injectable } from '@nestjs/common';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { IMonitoringInterviewAccessPort } from '@/modules/monitoring/application/ports/interview-access.port';
import {
  MONITORING_EVENT_TYPES,
  MonitoringEventType,
} from '@/modules/monitoring/domain/services/event-rules';
import { requireParticipant } from '@/modules/monitoring/application/utils/require-participant.util';

type CountsByType = Record<MonitoringEventType, number>;

export interface DetectionSessionSummary {
  sessionId: string;
  startedAt: Date;
  endedAt: Date | null;
  /** Null = the candidate did not turn monitoring on in this session. */
  monitoringConsentAt: Date | null;
  monitoringNoticeVersion: string | null;
  totalEvents: number;
  byType: CountsByType;
}

export interface DetectionSummary {
  totalEvents: number;
  unreviewedEvents: number;
  byType: CountsByType;
  /** Newest session first. */
  sessions: DetectionSessionSummary[];
}

const zeroCounts = (): CountsByType =>
  Object.fromEntries(MONITORING_EVENT_TYPES.map((t) => [t, 0])) as CountsByType;

export class GetDetectionSummaryQuery extends Query<DetectionSummary> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
  ) {
    super();
  }
}

/** Aggregate counts per type and per session — straight from the persisted events. */
@Injectable()
@QueryHandler(GetDetectionSummaryQuery)
export class GetDetectionSummaryHandler implements IQueryHandler<
  GetDetectionSummaryQuery,
  DetectionSummary
> {
  constructor(
    private readonly events: IDetectionEventRepository,
    private readonly access: IMonitoringInterviewAccessPort,
  ) {}

  async execute({
    requesterId,
    interviewId,
  }: GetDetectionSummaryQuery): Promise<DetectionSummary> {
    await requireParticipant(this.access, interviewId, requesterId);
    const [rows, sessions] = await Promise.all([
      this.events.summarizeForInterview(interviewId),
      this.access.listSessions(interviewId),
    ]);

    const summary: DetectionSummary = {
      totalEvents: 0,
      unreviewedEvents: 0,
      byType: zeroCounts(),
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        monitoringConsentAt: s.monitoringConsentAt,
        monitoringNoticeVersion: s.monitoringNoticeVersion,
        totalEvents: 0,
        byType: zeroCounts(),
      })),
    };
    const bySession = new Map(summary.sessions.map((s) => [s.sessionId, s]));
    for (const row of rows) {
      summary.totalEvents += row.count;
      summary.unreviewedEvents += row.unreviewed;
      summary.byType[row.eventType] += row.count;
      const session = bySession.get(row.interviewSessionId);
      if (session) {
        session.totalEvents += row.count;
        session.byType[row.eventType] += row.count;
      }
    }
    return summary;
  }
}
