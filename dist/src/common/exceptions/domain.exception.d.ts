export declare class DomainException extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare class EntityNotFoundException extends DomainException {
    constructor(entityName: string, id?: string);
}
export declare class BusinessRuleViolationException extends DomainException {
    constructor(message: string);
}
export declare class DuplicateEntityException extends DomainException {
    constructor(entityName: string, field?: string);
}
export declare class UnauthorizedDomainException extends DomainException {
    constructor(message?: string);
}
