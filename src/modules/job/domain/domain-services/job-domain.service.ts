import { Job } from '@/modules/job/domain/entities/job.entity';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

/**
 * Job Domain Service.
 * Contains cross-entity or complex business logic.
 * Framework-agnostic.
 */
export class JobDomainService {
  /**
   * Validate that a job is accepting applications.
   */
  static validateAcceptingApplications(job: Job): void {
    if (!job.isOpen) {
      throw new BusinessRuleViolationException(
        'This job is not currently accepting applications',
      );
    }

    if (job.isExpired) {
      throw new BusinessRuleViolationException('This job posting has expired');
    }

    if (job.isDeleted) {
      throw new BusinessRuleViolationException(
        'This job posting has been removed',
      );
    }
  }
}
