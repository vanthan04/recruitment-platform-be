import { BaseEntity } from '@/common/domain/base.entity';
import {
  InterviewSessionAlreadyEndedException,
  InterviewSessionNotOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

/**
 * One run of an interview. Open while `endedAt` is null; at most one open
 * session per interview (enforced by the DB's partial unique index, and
 * checked up front by StartInterviewSessionHandler for a clean error).
 */
export class InterviewSession extends BaseEntity {
  interviewId: string;
  startedAt: Date;
  endedAt: Date | null;
  /** Null once the user who started it has been deleted — attribution only. */
  startedById: string | null;
  /** When the candidate opted in to AI monitoring in this session; null = not monitored. */
  monitoringConsentAt: Date | null;
  /** Version of the monitoring notice the candidate was shown when consenting. */
  monitoringNoticeVersion: string | null;

  constructor(partial: Partial<InterviewSession>) {
    super();
    Object.assign(this, partial);
    this.startedAt = partial.startedAt ?? new Date();
    this.endedAt = partial.endedAt ?? null;
    this.startedById = partial.startedById ?? null;
    this.monitoringConsentAt = partial.monitoringConsentAt ?? null;
    this.monitoringNoticeVersion = partial.monitoringNoticeVersion ?? null;
  }

  isOpen(): boolean {
    return this.endedAt === null;
  }

  /**
   * Records the candidate's opt-in to AI monitoring. Only while the session is
   * open. The first consent is kept: re-starting monitoring later in the same
   * session (e.g. after a reconnect) must not rewrite when/what was agreed to.
   */
  recordMonitoringConsent(noticeVersion: string, at: Date = new Date()): void {
    if (!this.isOpen()) throw new InterviewSessionNotOpenException();
    if (this.monitoringConsentAt) return;
    this.monitoringConsentAt = at;
    this.monitoringNoticeVersion = noticeVersion;
  }

  end(at: Date = new Date()): void {
    if (!this.isOpen()) throw new InterviewSessionAlreadyEndedException();
    this.endedAt = at;
  }
}
