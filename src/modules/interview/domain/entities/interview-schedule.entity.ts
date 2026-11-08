import { BaseEntity } from '@/common/domain/base.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import {
  CannotRescheduleCancelledInterviewException,
  InterviewTimeInPastException,
  InterviewAlreadyCancelledException,
  InterviewNotActionableException,
  InterviewLocationOrMeetingLinkRequiredException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

const ACTIONABLE_STATUSES = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.RESCHEDULED,
];

/** A reminder goes out this long before the interview starts. */
export const INTERVIEW_REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
/**
 * An interview set up (or last rescheduled) with less than a day's notice has
 * no 24h point to remind at, so it is reminded this long before it starts
 * instead — unless it was set up with no more notice than this, in which case
 * everyone was told moments ago and a reminder would only be a duplicate.
 */
export const INTERVIEW_SHORT_NOTICE_REMINDER_LEAD_MS = 2 * 60 * 60 * 1000;

export class InterviewSchedule extends BaseEntity {
  jobApplicationId: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: InterviewStatus;
  /** Null once the recruiter who scheduled it has been deleted — attribution only, never used for ownership checks. */
  createdById: string | null;
  /** When the reminder for the current `scheduledAt` was sent; null = not yet. Reset on reschedule. */
  reminderSentAt: Date | null;

  constructor(partial: Partial<InterviewSchedule>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? InterviewStatus.SCHEDULED;
    this.durationMinutes = partial.durationMinutes ?? null;
    this.reminderSentAt = partial.reminderSentAt ?? null;
    this.ensureLocationOrMeetingLink();
  }

  reschedule(
    scheduledAt: Date,
    location?: string | null,
    meetingLink?: string | null,
    note?: string | null,
    durationMinutes?: number | null,
  ): void {
    if (this.status === InterviewStatus.CANCELLED) {
      throw new CannotRescheduleCancelledInterviewException();
    }
    if (!ACTIONABLE_STATUSES.includes(this.status)) {
      throw new InterviewNotActionableException('rescheduled');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new InterviewTimeInPastException();
    }

    this.scheduledAt = scheduledAt;
    if (location !== undefined) this.location = location;
    if (meetingLink !== undefined) this.meetingLink = meetingLink;
    if (note !== undefined) this.note = note;
    if (durationMinutes !== undefined) this.durationMinutes = durationMinutes;
    this.ensureLocationOrMeetingLink();
    this.status = InterviewStatus.RESCHEDULED;
    // The reminder that went out (if any) was for the old time — the new one
    // gets its own.
    this.reminderSentAt = null;
  }

  cancel(): void {
    if (this.status === InterviewStatus.CANCELLED) {
      throw new InterviewAlreadyCancelledException();
    }
    if (!ACTIONABLE_STATUSES.includes(this.status)) {
      throw new InterviewNotActionableException('cancelled');
    }
    this.status = InterviewStatus.CANCELLED;
  }

  /** Marks the interview as having taken place. Only valid from a still-pending state. */
  complete(): void {
    if (!ACTIONABLE_STATUSES.includes(this.status)) {
      throw new InterviewNotActionableException('completed');
    }
    this.status = InterviewStatus.COMPLETED;
  }

  /** Marks the candidate as a no-show. Only valid from a still-pending state. */
  markNoShow(): void {
    if (!ACTIONABLE_STATUSES.includes(this.status)) {
      throw new InterviewNotActionableException('marked as no-show');
    }
    this.status = InterviewStatus.NO_SHOW;
  }

  /**
   * Whether the reminder should be sent now. True at most once per scheduled
   * time (`reminderSentAt` is the guard) and only while the interview is
   * still pending and in the future.
   *
   * When it fires depends on how much notice the interview was given — the
   * time it was last set up or rescheduled is `updatedAt`, since only those
   * changes touch an active interview:
   * - more than 24h of notice → 24h before the start;
   * - between 2h and 24h → 2h before the start (there is no 24h mark left);
   * - 2h or less → never; the booking email just went out.
   */
  isReminderDue(now: Date = new Date()): boolean {
    if (!this.isActive() || this.reminderSentAt) return false;

    const untilStartMs = this.scheduledAt.getTime() - now.getTime();
    if (untilStartMs <= 0) return false;

    const noticeMs = this.scheduledAt.getTime() - this.updatedAt.getTime();
    if (noticeMs <= INTERVIEW_SHORT_NOTICE_REMINDER_LEAD_MS) return false;

    const leadMs =
      noticeMs > INTERVIEW_REMINDER_LEAD_MS
        ? INTERVIEW_REMINDER_LEAD_MS
        : INTERVIEW_SHORT_NOTICE_REMINDER_LEAD_MS;
    return untilStartMs <= leadMs;
  }

  /** SCHEDULED or RESCHEDULED — still pending, as opposed to a terminal outcome. */
  isActive(): boolean {
    return ACTIONABLE_STATUSES.includes(this.status);
  }

  private ensureLocationOrMeetingLink(): void {
    if (!this.location && !this.meetingLink) {
      throw new InterviewLocationOrMeetingLinkRequiredException();
    }
  }
}
