import { Job } from '@/modules/job/domain/entities/job.entity';
import {
  JobNotAcceptingApplicationsException,
  JobExpiredException,
  JobRemovedException,
} from '@/modules/job/domain/exceptions/job.exceptions';

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
      throw new JobNotAcceptingApplicationsException();
    }

    if (job.isExpired) {
      throw new JobExpiredException();
    }

    if (job.isDeleted) {
      throw new JobRemovedException();
    }
  }
}
