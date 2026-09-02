import { BaseEntity } from '@/common/domain/base.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { ApplicationNotPendingException } from '@/modules/application/domain/exceptions/application.exceptions';

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
      throw new ApplicationNotPendingException('accepted');
    }
    this.status = ApplicationStatus.ACCEPTED;
  }

  reject(): void {
    if (this.status !== ApplicationStatus.PENDING) {
      throw new ApplicationNotPendingException('rejected');
    }
    this.status = ApplicationStatus.REJECTED;
  }

  withdraw(): void {
    if (this.status !== ApplicationStatus.PENDING) {
      throw new ApplicationNotPendingException('withdrawn');
    }
    this.status = ApplicationStatus.WITHDRAWN;
  }

  isPending(): boolean {
    return this.status === ApplicationStatus.PENDING;
  }
}
