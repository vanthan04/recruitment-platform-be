import { BaseEntity } from '@/common/domain/base.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

export class JobApplication extends BaseEntity {
  status: ApplicationStatus;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  cvId: string;

  constructor(partial: Partial<JobApplication>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? ApplicationStatus.PENDING;
  }

  accept(): void {
    if (this.status !== ApplicationStatus.PENDING) {
      throw new BusinessRuleViolationException('Only pending applications can be accepted');
    }
    this.status = ApplicationStatus.ACCEPTED;
  }

  reject(): void {
    if (this.status !== ApplicationStatus.PENDING) {
      throw new BusinessRuleViolationException('Only pending applications can be rejected');
    }
    this.status = ApplicationStatus.REJECTED;
  }

  isPending(): boolean {
    return this.status === ApplicationStatus.PENDING;
  }
}
