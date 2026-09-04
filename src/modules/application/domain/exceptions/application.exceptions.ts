import {
  EntityNotFoundException,
  DuplicateEntityException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Application-module (job applications) domain exceptions. See auth/cv/job
 * modules for the pattern: each carries a module-specific `code` while
 * staying an `instanceof` of the shared category so GlobalExceptionFilter
 * still resolves the right HTTP status.
 *
 * The Job/CV business-rule checks below (`ReferencedJobNotFoundException`,
 * `JobNotAcceptingApplicationsException`, `CvNotPublishedException`, ...)
 * intentionally duplicate the equivalent exceptions in the job/cv modules'
 * own `domain/exceptions` — this module only sees those aggregates through
 * read-only lookup-port DTOs (`JobLookupResult`, `CvLookupResult`), never
 * the real domain entities, so it can't reuse their exception classes
 * without crossing the module boundary the ports establish.
 */

export class JobApplicationNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Application', id, 'APPLICATION_NOT_FOUND');
    this.name = 'JobApplicationNotFoundException';
  }
}

export class ReferencedJobNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Job', id, 'APPLICATION_JOB_NOT_FOUND');
    this.name = 'ReferencedJobNotFoundException';
  }
}

export class ReferencedCvNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('CV', id, 'APPLICATION_CV_NOT_FOUND');
    this.name = 'ReferencedCvNotFoundException';
  }
}

export class JobNotAcceptingApplicationsException extends BusinessRuleViolationException {
  constructor() {
    super(
      'This job is not currently accepting applications',
      'APPLICATION_JOB_NOT_ACCEPTING',
    );
    this.name = 'JobNotAcceptingApplicationsException';
  }
}

export class JobPostingExpiredException extends BusinessRuleViolationException {
  constructor() {
    super('This job posting has expired', 'APPLICATION_JOB_EXPIRED');
    this.name = 'JobPostingExpiredException';
  }
}

export class JobPostingRemovedException extends BusinessRuleViolationException {
  constructor() {
    super('This job posting has been removed', 'APPLICATION_JOB_REMOVED');
    this.name = 'JobPostingRemovedException';
  }
}

export class CvNotPublishedException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Only published CVs can be used for job applications',
      'APPLICATION_CV_NOT_PUBLISHED',
    );
    this.name = 'CvNotPublishedException';
  }
}

export class ReferencedCvDeletedException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Deleted CVs cannot be used for job applications',
      'APPLICATION_CV_DELETED',
    );
    this.name = 'ReferencedCvDeletedException';
  }
}

export class CvOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this CV', 'APPLICATION_CV_NOT_OWNER');
    this.name = 'CvOwnershipException';
  }
}

export class AlreadyAppliedException extends DuplicateEntityException {
  constructor() {
    super('Application', 'jobId', 'APPLICATION_ALREADY_APPLIED');
    this.name = 'AlreadyAppliedException';
  }
}

export class ApplicationOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this application', 'APPLICATION_NOT_OWNER');
    this.name = 'ApplicationOwnershipException';
  }
}

export class InvalidApplicationStatusTransitionException extends BusinessRuleViolationException {
  constructor(from: string, to: string) {
    super(
      `Cannot transition application status from ${from} to ${to}`,
      'APPLICATION_INVALID_STATUS_TRANSITION',
    );
    this.name = 'InvalidApplicationStatusTransitionException';
  }
}
