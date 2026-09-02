import {
  EntityNotFoundException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Job-alert-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class SavedSearchCategoryNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Category', id, 'JOB_ALERT_CATEGORY_NOT_FOUND');
    this.name = 'SavedSearchCategoryNotFoundException';
  }
}

export class SavedSearchNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('SavedSearch', id, 'JOB_ALERT_SAVED_SEARCH_NOT_FOUND');
    this.name = 'SavedSearchNotFoundException';
  }
}

export class SavedSearchOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this saved search', 'JOB_ALERT_NOT_OWNER');
    this.name = 'SavedSearchOwnershipException';
  }
}
