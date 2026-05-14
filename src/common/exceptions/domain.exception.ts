/**
 * Framework-agnostic domain exception.
 * Used in the domain layer to express business rule violations
 * without depending on NestJS or any other framework.
 */
export class DomainException extends Error {
  public readonly code: string;

  constructor(message: string, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainException';
    this.code = code;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id?: string) {
    super(
      id
        ? `${entityName} with id "${id}" not found`
        : `${entityName} not found`,
      'ENTITY_NOT_FOUND',
    );
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleViolationException';
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entityName: string, field?: string) {
    super(
      field
        ? `${entityName} with this ${field} already exists`
        : `${entityName} already exists`,
      'DUPLICATE_ENTITY',
    );
    this.name = 'DuplicateEntityException';
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED_ACTION');
    this.name = 'UnauthorizedDomainException';
  }
}
