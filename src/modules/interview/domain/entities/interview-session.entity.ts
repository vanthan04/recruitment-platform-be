import { BaseEntity } from '@/common/domain/base.entity';
import { InterviewSessionAlreadyEndedException } from '@/modules/interview/domain/exceptions/interview.exceptions';

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

  constructor(partial: Partial<InterviewSession>) {
    super();
    Object.assign(this, partial);
    this.startedAt = partial.startedAt ?? new Date();
    this.endedAt = partial.endedAt ?? null;
    this.startedById = partial.startedById ?? null;
  }

  isOpen(): boolean {
    return this.endedAt === null;
  }

  end(at: Date = new Date()): void {
    if (!this.isOpen()) throw new InterviewSessionAlreadyEndedException();
    this.endedAt = at;
  }
}
