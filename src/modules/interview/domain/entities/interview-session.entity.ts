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
   * open. Re-starting under the same notice (e.g. after a reconnect) keeps the
   * original consent; agreeing to a different notice version is a new consent
   * and replaces it, so the record always names the terms currently in force.
   */
  recordMonitoringConsent(noticeVersion: string, at: Date = new Date()): void {
    if (!this.isOpen()) throw new InterviewSessionNotOpenException();
    if (
      this.monitoringConsentAt &&
      this.monitoringNoticeVersion === noticeVersion
    ) {
      return;
    }
    this.monitoringConsentAt = at;
    this.monitoringNoticeVersion = noticeVersion;
  }

  end(at: Date = new Date()): void {
    if (!this.isOpen()) throw new InterviewSessionAlreadyEndedException();
    this.endedAt = at;
  }
}
