import { BaseEntity } from '@/common/domain/base.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

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

  reschedule(scheduledAt: Date, location?: string | null, meetingLink?: string | null, note?: string | null): void {
    if (this.status === InterviewStatus.CANCELLED) {
      throw new BusinessRuleViolationException('Cannot reschedule a cancelled interview');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BusinessRuleViolationException('Interview time must be in the future');
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
      throw new BusinessRuleViolationException('Interview is already cancelled');
    }
    this.status = InterviewStatus.CANCELLED;
  }

  private ensureLocationOrMeetingLink(): void {
    if (!this.location && !this.meetingLink) {
      throw new BusinessRuleViolationException('Either location or meetingLink must be provided');
    }
  }
}
