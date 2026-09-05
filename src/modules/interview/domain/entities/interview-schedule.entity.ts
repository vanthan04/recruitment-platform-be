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

export class InterviewSchedule extends BaseEntity {
  jobApplicationId: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: InterviewStatus;
  createdById: string;

  constructor(partial: Partial<InterviewSchedule>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? InterviewStatus.SCHEDULED;
    this.durationMinutes = partial.durationMinutes ?? null;
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

  private ensureLocationOrMeetingLink(): void {
    if (!this.location && !this.meetingLink) {
      throw new InterviewLocationOrMeetingLinkRequiredException();
    }
  }
}
