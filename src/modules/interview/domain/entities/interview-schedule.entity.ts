import { BaseEntity } from '@/common/domain/base.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import {
  CannotRescheduleCancelledInterviewException,
  InterviewTimeInPastException,
  InterviewAlreadyCancelledException,
  InterviewLocationOrMeetingLinkRequiredException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

export class InterviewSchedule extends BaseEntity {
  jobApplicationId: string;
  scheduledAt: Date;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: InterviewStatus;
  createdById: string;

  constructor(partial: Partial<InterviewSchedule>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? InterviewStatus.SCHEDULED;
    this.ensureLocationOrMeetingLink();
  }

  reschedule(
    scheduledAt: Date,
    location?: string | null,
    meetingLink?: string | null,
    note?: string | null,
  ): void {
    if (this.status === InterviewStatus.CANCELLED) {
      throw new CannotRescheduleCancelledInterviewException();
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new InterviewTimeInPastException();
    }

    this.scheduledAt = scheduledAt;
    if (location !== undefined) this.location = location;
    if (meetingLink !== undefined) this.meetingLink = meetingLink;
    if (note !== undefined) this.note = note;
    this.ensureLocationOrMeetingLink();
    this.status = InterviewStatus.RESCHEDULED;
  }

  cancel(): void {
    if (this.status === InterviewStatus.CANCELLED) {
      throw new InterviewAlreadyCancelledException();
    }
    this.status = InterviewStatus.CANCELLED;
  }

  private ensureLocationOrMeetingLink(): void {
    if (!this.location && !this.meetingLink) {
      throw new InterviewLocationOrMeetingLinkRequiredException();
    }
  }
}
