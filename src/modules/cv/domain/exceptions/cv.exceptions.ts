import {
  EntityNotFoundException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * CV-module domain exceptions.
 * Each carries a module-specific `code` so clients can branch on it
 * without parsing the message, while still mapping to the right HTTP
 * status through GlobalExceptionFilter (it checks `instanceof` against
 * the shared category in `common/exceptions/domain.exception.ts`).
 */

export class CvNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('CV', id, 'CV_NOT_FOUND');
    this.name = 'CvNotFoundException';
  }
}

export class CvAlreadyPublishedException extends BusinessRuleViolationException {
  constructor() {
    super('CV is already published', 'CV_ALREADY_PUBLISHED');
    this.name = 'CvAlreadyPublishedException';
  }
}

export class CvMissingContentException extends BusinessRuleViolationException {
  constructor() {
    super(
      'CV must have at least one experience or education to be published',
      'CV_MISSING_CONTENT',
    );
    this.name = 'CvMissingContentException';
  }
}

export class CvAlreadyDraftException extends BusinessRuleViolationException {
  constructor() {
    super('CV is already in draft', 'CV_ALREADY_DRAFT');
    this.name = 'CvAlreadyDraftException';
  }
}

export class CvAlreadyDeletedException extends BusinessRuleViolationException {
  constructor() {
    super('CV is already deleted', 'CV_ALREADY_DELETED');
    this.name = 'CvAlreadyDeletedException';
  }
}

export class CvNotDeletedException extends BusinessRuleViolationException {
  constructor() {
    super('CV is not deleted', 'CV_NOT_DELETED');
    this.name = 'CvNotDeletedException';
  }
}

export class CvOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this CV', 'CV_NOT_OWNER');
    this.name = 'CvOwnershipException';
  }
}

export class CvSkillAlreadyExistsException extends BusinessRuleViolationException {
  constructor(skillName: string) {
    super(
      `Skill "${skillName}" already exists in this CV`,
      'CV_SKILL_DUPLICATE',
    );
    this.name = 'CvSkillAlreadyExistsException';
  }
}

export class CvTitleRequiredException extends BusinessRuleViolationException {
  constructor() {
    super('CV title cannot be empty', 'CV_TITLE_REQUIRED');
    this.name = 'CvTitleRequiredException';
  }
}

export class CvNotPublishedForApplicationException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Only published CVs can be used for job applications',
      'CV_NOT_PUBLISHED_FOR_APPLICATION',
    );
    this.name = 'CvNotPublishedForApplicationException';
  }
}

export class CvDeletedForApplicationException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Deleted CVs cannot be used for job applications',
      'CV_DELETED_NOT_USABLE_FOR_APPLICATION',
    );
    this.name = 'CvDeletedForApplicationException';
  }
}
