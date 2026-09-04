import { BaseEntity } from '@/common/domain/base.entity';
import {
  ApplicationStatus,
  canTransitionApplicationStatus,
  isTerminalApplicationStatus,
} from '@/modules/application/domain/value-objects/application-status.vo';
import { InvalidApplicationStatusTransitionException } from '@/modules/application/domain/exceptions/application.exceptions';

export class JobApplication extends BaseEntity {
  status: ApplicationStatus;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  cvId: string;

  constructor(partial: Partial<JobApplication>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? ApplicationStatus.APPLIED;
  }

  /**
   * Recruiter-driven forward transition (APPLIED -> ... -> HIRED, or
   * REJECTED from any non-terminal step). See application-status.vo's
   * transition map for exactly which moves are allowed.
   */
  transitionTo(newStatus: ApplicationStatus): void {
    if (!canTransitionApplicationStatus(this.status, newStatus)) {
      throw new InvalidApplicationStatusTransitionException(
        this.status,
        newStatus,
      );
    }
    this.status = newStatus;
  }

  /** Candidate-driven: withdraw from any non-terminal state. */
  withdraw(): void {
    if (isTerminalApplicationStatus(this.status)) {
      throw new InvalidApplicationStatusTransitionException(
        this.status,
        ApplicationStatus.WITHDRAWN,
      );
    }
    this.status = ApplicationStatus.WITHDRAWN;
  }
}
