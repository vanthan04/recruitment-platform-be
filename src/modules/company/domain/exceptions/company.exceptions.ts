import {
  EntityNotFoundException,
  DuplicateEntityException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Company-module domain exceptions.
 * Each carries a module-specific `code` so clients can branch on it
 * without parsing the message, while still mapping to the right HTTP
 * status through GlobalExceptionFilter (it checks `instanceof` against
 * the shared category in `common/exceptions/domain.exception.ts`).
 */

export class CompanyNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Company', id, 'COMPANY_NOT_FOUND');
    this.name = 'CompanyNotFoundException';
  }
}

export class CompanyAlreadyExistsException extends DuplicateEntityException {
  constructor() {
    super('Company', 'owner', 'COMPANY_ALREADY_EXISTS');
    this.name = 'CompanyAlreadyExistsException';
  }
}

export class CompanyOwnershipException extends UnauthorizedDomainException {
  constructor() {
    super('You are not the owner of this company', 'COMPANY_NOT_OWNER');
    this.name = 'CompanyOwnershipException';
  }
}

export class CompanyAlreadyDeletedException extends BusinessRuleViolationException {
  constructor() {
    super('Company is already deleted', 'COMPANY_ALREADY_DELETED');
    this.name = 'CompanyAlreadyDeletedException';
  }
}
