"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedDomainException = exports.DuplicateEntityException = exports.BusinessRuleViolationException = exports.EntityNotFoundException = exports.DomainException = void 0;
class DomainException extends Error {
    code;
    constructor(message, code = 'DOMAIN_ERROR') {
        super(message);
        this.name = 'DomainException';
        this.code = code;
    }
}
exports.DomainException = DomainException;
class EntityNotFoundException extends DomainException {
    constructor(entityName, id) {
        super(id
            ? `${entityName} with id "${id}" not found`
            : `${entityName} not found`, 'ENTITY_NOT_FOUND');
        this.name = 'EntityNotFoundException';
    }
}
exports.EntityNotFoundException = EntityNotFoundException;
class BusinessRuleViolationException extends DomainException {
    constructor(message) {
        super(message, 'BUSINESS_RULE_VIOLATION');
        this.name = 'BusinessRuleViolationException';
    }
}
exports.BusinessRuleViolationException = BusinessRuleViolationException;
class DuplicateEntityException extends DomainException {
    constructor(entityName, field) {
        super(field
            ? `${entityName} with this ${field} already exists`
            : `${entityName} already exists`, 'DUPLICATE_ENTITY');
        this.name = 'DuplicateEntityException';
    }
}
exports.DuplicateEntityException = DuplicateEntityException;
class UnauthorizedDomainException extends DomainException {
    constructor(message = 'You are not authorized to perform this action') {
        super(message, 'UNAUTHORIZED_ACTION');
        this.name = 'UnauthorizedDomainException';
    }
}
exports.UnauthorizedDomainException = UnauthorizedDomainException;
//# sourceMappingURL=domain.exception.js.map