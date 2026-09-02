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

/**
 * Each subclass below accepts an optional `code` override so per-module
 * exceptions (e.g. `src/modules/cv/domain/exceptions`) can extend it with a
 * specific error code — e.g. `CV_NOT_FOUND` instead of the generic
 * `ENTITY_NOT_FOUND` — while staying an `instanceof` of the shared category,
 * which is what GlobalExceptionFilter uses to resolve the HTTP status.
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id?: string, code = 'ENTITY_NOT_FOUND') {
    super(
      id
        ? `${entityName} with id "${id}" not found`
        : `${entityName} not found`,
      code,
    );
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION') {
    super(message, code);
    this.name = 'BusinessRuleViolationException';
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entityName: string, field?: string, code = 'DUPLICATE_ENTITY') {
    super(
      field
        ? `${entityName} with this ${field} already exists`
        : `${entityName} already exists`,
      code,
    );
    this.name = 'DuplicateEntityException';
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(
    message = 'You are not authorized to perform this action',
    code = 'UNAUTHORIZED_ACTION',
  ) {
    super(message, code);
    this.name = 'UnauthorizedDomainException';
  }
}
