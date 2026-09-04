import {
  EntityNotFoundException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Job-module domain exceptions.
 * Each carries a module-specific `code` so clients can branch on it
 * without parsing the message, while still mapping to the right HTTP
 * status through GlobalExceptionFilter (it checks `instanceof` against
 * the shared category in `common/exceptions/domain.exception.ts`).
 */

export class JobNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Job', id, 'JOB_NOT_FOUND');
    this.name = 'JobNotFoundException';
  }
}

export class JobCategoryNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Category', id, 'JOB_CATEGORY_NOT_FOUND');
    this.name = 'JobCategoryNotFoundException';
  }
}

export class JobSkillNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Skill', id, 'JOB_SKILL_NOT_FOUND');
    this.name = 'JobSkillNotFoundException';
  }
}

export class CompanyProfileRequiredException extends BusinessRuleViolationException {
  constructor() {
    super(
      'You must create a company profile before posting a job',
      'JOB_COMPANY_PROFILE_REQUIRED',
    );
    this.name = 'CompanyProfileRequiredException';
  }
}

export class JobAlreadyOpenException extends BusinessRuleViolationException {
  constructor() {
    super('Job is already open', 'JOB_ALREADY_OPEN');
    this.name = 'JobAlreadyOpenException';
  }
}

export class JobAlreadyClosedException extends BusinessRuleViolationException {
  constructor() {
    super('Job is already closed', 'JOB_ALREADY_CLOSED');
    this.name = 'JobAlreadyClosedException';
  }
}

export class JobNotClosedException extends BusinessRuleViolationException {
  constructor() {
    super('Only closed jobs can be reopened', 'JOB_NOT_CLOSED');
    this.name = 'JobNotClosedException';
  }
}

export class JobAlreadyDeletedException extends BusinessRuleViolationException {
  constructor() {
    super('Job is already deleted', 'JOB_ALREADY_DELETED');
    this.name = 'JobAlreadyDeletedException';
  }
}

export class JobOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this job posting', 'JOB_NOT_OWNER');
    this.name = 'JobOwnershipException';
  }
}

export class JobNotAcceptingApplicationsException extends BusinessRuleViolationException {
  constructor() {
    super(
      'This job is not currently accepting applications',
      'JOB_NOT_ACCEPTING_APPLICATIONS',
    );
    this.name = 'JobNotAcceptingApplicationsException';
  }
}

export class JobExpiredException extends BusinessRuleViolationException {
  constructor() {
    super('This job posting has expired', 'JOB_EXPIRED');
    this.name = 'JobExpiredException';
  }
}

export class JobRemovedException extends BusinessRuleViolationException {
  constructor() {
    super('This job posting has been removed', 'JOB_REMOVED');
    this.name = 'JobRemovedException';
  }
}
