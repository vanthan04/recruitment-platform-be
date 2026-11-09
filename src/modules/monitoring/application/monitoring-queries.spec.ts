import { ConfigService } from '@nestjs/config';
import {
  ListDetectionEventsHandler,
  ListDetectionEventsQuery,
} from './queries/list-detection-events.query';
import {
  GetDetectionSummaryHandler,
  GetDetectionSummaryQuery,
} from './queries/get-detection-summary.query';
import {
  ReviewDetectionEventCommand,
  ReviewDetectionEventHandler,
} from './commands/review-detection-event.command';
import {
  PurgeExpiredDetectionEventsCommand,
  PurgeExpiredDetectionEventsHandler,
} from './commands/purge-expired-detection-events.command';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { IMonitoringInterviewAccessPort } from '@/modules/monitoring/application/ports/interview-access.port';
import { DetectionEvent } from '@/modules/monitoring/domain/entities/detection-event.entity';
import {
  DetectionEventNotFoundException,
  DetectionEventReviewNotAllowedException,
  MonitoringAccessNotAllowedException,
  MonitoringInterviewNotFoundException,
} from '@/modules/monitoring/domain/exceptions/monitoring.exceptions';

const makeEvent = (overrides: Partial<DetectionEvent> = {}) =>
  new DetectionEvent({
    id: 'event-1',
    interviewSessionId: 'session-1',
    interviewId: 'interview-1',
    eventType: 'PHONE_DETECTED',
    objectClass: 'cell phone',
    confidence: 0.82,
    detectedAt: new Date('2026-11-09T10:00:00Z'),
    endedAt: new Date('2026-11-09T10:00:12Z'),
    frameCount: 12,
    metadata: { personCount: 1, endReason: 'condition-cleared' },
    reviewedAt: new Date('2026-11-09T11:00:00Z'),
    reviewedById: 'recruiter-1',
    reviewNote: 'Ứng viên giải thích là đồng hồ hẹn giờ',
    ...overrides,
  });

describe('monitoring queries and commands', () => {
  let events: jest.Mocked<IDetectionEventRepository>;
  let access: jest.Mocked<IMonitoringInterviewAccessPort>;

  beforeEach(() => {
    events = {
      create: jest.fn(),
      close: jest.fn(),
      findById: jest.fn().mockResolvedValue(makeEvent()),
      listForInterview: jest
        .fn()
        .mockResolvedValue({ items: [makeEvent()], total: 1 }),
      summarizeForInterview: jest.fn(),
      saveReview: jest.fn((e: DetectionEvent) => Promise.resolve(e)),
      deleteDetectedBefore: jest.fn().mockResolvedValue(3),
    };
    access = {
      resolveRole: jest.fn((_interviewId: string, userId: string) =>
        Promise.resolve({
          role:
            userId === 'candidate-1'
              ? 'CANDIDATE'
              : userId === 'recruiter-1'
                ? 'RECRUITER'
                : null,
        } as const),
      ),
      listSessions: jest.fn(),
    };
  });

  describe('ListDetectionEventsHandler', () => {
    const list = (userId: string) =>
      new ListDetectionEventsHandler(events, access).execute(
        new ListDetectionEventsQuery(
          userId,
          'interview-1',
          { eventType: 'PHONE_DETECTED' },
          2,
          10,
        ),
      );

    it('gives the recruiter the timeline including their review note', async () => {
      const result = await list('recruiter-1');

      expect(events.listForInterview).toHaveBeenCalledWith(
        'interview-1',
        { eventType: 'PHONE_DETECTED' },
        2,
        10,
      );
      expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
      expect(result.events[0]).toMatchObject({
        id: 'event-1',
        sessionId: 'session-1',
        durationMs: 12_000,
        reviewNote: 'Ứng viên giải thích là đồng hồ hẹn giờ',
        reviewedById: 'recruiter-1',
      });
    });

    it('lets the candidate see events about themselves, without the recruiter-private note', async () => {
      const result = await list('candidate-1');

      expect(result.events[0].reviewedAt).toBeInstanceOf(Date);
      expect(result.events[0]).not.toHaveProperty('reviewNote');
      expect(result.events[0]).not.toHaveProperty('reviewedById');
    });

    it('refuses anyone else, and 404s an unknown interview', async () => {
      await expect(list('stranger')).rejects.toThrow(
        MonitoringAccessNotAllowedException,
      );
      access.resolveRole.mockResolvedValue(null);
      await expect(list('recruiter-1')).rejects.toThrow(
        MonitoringInterviewNotFoundException,
      );
      expect(events.listForInterview).not.toHaveBeenCalled();
    });

    it('reports an open event with no end and no duration', async () => {
      events.listForInterview.mockResolvedValue({
        items: [makeEvent({ endedAt: null })],
        total: 1,
      });
      const result = await list('recruiter-1');
      expect(result.events[0]).toMatchObject({
        endedAt: null,
        durationMs: null,
      });
    });
  });

  describe('GetDetectionSummaryHandler', () => {
    it('adds up per type and per session, from persisted rows', async () => {
      events.summarizeForInterview.mockResolvedValue([
        {
          interviewSessionId: 's2',
          eventType: 'PHONE_DETECTED',
          count: 2,
          unreviewed: 1,
        },
        {
          interviewSessionId: 's2',
          eventType: 'PERSON_ABSENT',
          count: 1,
          unreviewed: 1,
        },
        {
          interviewSessionId: 's1',
          eventType: 'PHONE_DETECTED',
          count: 3,
          unreviewed: 0,
        },
      ]);
      access.listSessions.mockResolvedValue([
        {
          id: 's2',
          startedAt: new Date(2),
          endedAt: null,
          monitoringConsentAt: new Date(3),
          monitoringNoticeVersion: 'v2',
        },
        {
          id: 's1',
          startedAt: new Date(1),
          endedAt: new Date(2),
          monitoringConsentAt: null,
          monitoringNoticeVersion: null,
        },
      ]);

      const summary = await new GetDetectionSummaryHandler(
        events,
        access,
      ).execute(new GetDetectionSummaryQuery('recruiter-1', 'interview-1'));

      expect(summary).toMatchObject({
        totalEvents: 6,
        unreviewedEvents: 2,
        byType: {
          PERSON_ABSENT: 1,
          MULTIPLE_PERSONS: 0,
          PHONE_DETECTED: 5,
          LAPTOP_DETECTED: 0,
        },
      });
      expect(
        summary.sessions.map((s) => [
          s.sessionId,
          s.totalEvents,
          s.monitoringNoticeVersion,
        ]),
      ).toEqual([
        ['s2', 3, 'v2'],
        ['s1', 3, null],
      ]);
    });

    it('refuses non-participants', async () => {
      await expect(
        new GetDetectionSummaryHandler(events, access).execute(
          new GetDetectionSummaryQuery('stranger', 'interview-1'),
        ),
      ).rejects.toThrow(MonitoringAccessNotAllowedException);
      expect(events.summarizeForInterview).not.toHaveBeenCalled();
    });
  });

  describe('ReviewDetectionEventHandler', () => {
    const review = (userId: string, note: string | null = '  Đã trao đổi  ') =>
      new ReviewDetectionEventHandler(events, access).execute(
        new ReviewDetectionEventCommand(userId, 'event-1', note),
      );

    it('lets the job recruiter review with a trimmed note', async () => {
      events.findById.mockResolvedValue(
        makeEvent({ reviewedAt: null, reviewedById: null, reviewNote: null }),
      );

      const result = await review('recruiter-1');

      expect(result).toMatchObject({
        reviewedById: 'recruiter-1',
        reviewNote: 'Đã trao đổi',
      });
      expect(result.reviewedAt).toBeInstanceOf(Date);
      expect(events.saveReview).toHaveBeenCalledTimes(1);
    });

    it('stores an empty note as null', async () => {
      const result = await review('recruiter-1', '   ');
      expect(result.reviewNote).toBeNull();
    });

    it('refuses the candidate (can read, cannot review)', async () => {
      await expect(review('candidate-1')).rejects.toThrow(
        DetectionEventReviewNotAllowedException,
      );
      expect(events.saveReview).not.toHaveBeenCalled();
    });

    it('answers not-found to a stranger, so ids do not reveal events', async () => {
      await expect(review('stranger')).rejects.toThrow(
        DetectionEventNotFoundException,
      );
      events.findById.mockResolvedValue(null);
      await expect(review('recruiter-1')).rejects.toThrow(
        DetectionEventNotFoundException,
      );
      expect(events.saveReview).not.toHaveBeenCalled();
    });
  });

  describe('PurgeExpiredDetectionEventsHandler', () => {
    it('deletes events detected more than the retention period ago', async () => {
      const config = {
        get: jest.fn((_k: string, fallback: unknown) => fallback),
      } as unknown as ConfigService;
      const now = new Date('2026-11-09T00:00:00Z');

      const deleted = await new PurgeExpiredDetectionEventsHandler(
        events,
        config,
      ).execute(new PurgeExpiredDetectionEventsCommand(now));

      expect(deleted).toBe(3);
      expect(events.deleteDetectedBefore).toHaveBeenCalledWith(
        new Date('2026-05-13T00:00:00Z'),
      ); // 180 days
    });
  });
});
