import {
  EntityNotFoundException,
  DuplicateEntityException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Auth-module domain exceptions.
 * Each carries a module-specific `code` so clients can branch on it
 * without parsing the message, while still mapping to the right HTTP
 * status through GlobalExceptionFilter (it checks `instanceof` against
 * the shared category in `common/exceptions/domain.exception.ts`).
 */

export class UserNotFoundException extends EntityNotFoundException {
  constructor(identifier?: string) {
    super('User', identifier, 'AUTH_USER_NOT_FOUND');
    this.name = 'UserNotFoundException';
  }
}

export class InvalidVerificationCodeException extends EntityNotFoundException {
  constructor() {
    super('Verification code', undefined, 'AUTH_INVALID_VERIFICATION_CODE');
    this.name = 'InvalidVerificationCodeException';
  }
}

export class EmailAlreadyRegisteredException extends DuplicateEntityException {
  constructor() {
    super('User', 'email', 'AUTH_EMAIL_ALREADY_REGISTERED');
    this.name = 'EmailAlreadyRegisteredException';
  }
}

export class InvalidCredentialsException extends UnauthorizedDomainException {
  constructor() {
    super('Email or password is incorrect', 'AUTH_INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsException';
  }
}

export class InvalidOldPasswordException extends UnauthorizedDomainException {
  constructor() {
    super('Old password is incorrect', 'AUTH_INVALID_OLD_PASSWORD');
    this.name = 'InvalidOldPasswordException';
  }
}

export class InvalidRefreshTokenException extends UnauthorizedDomainException {
  constructor() {
    super('Invalid refresh token', 'AUTH_INVALID_REFRESH_TOKEN');
    this.name = 'InvalidRefreshTokenException';
  }
}

export class RefreshTokenAccessDeniedException extends UnauthorizedDomainException {
  constructor() {
    super('Access denied', 'AUTH_REFRESH_ACCESS_DENIED');
    this.name = 'RefreshTokenAccessDeniedException';
  }
}

export class InvalidOrExpiredExchangeCodeException extends UnauthorizedDomainException {
  constructor() {
    super(
      'This login code is invalid, expired, or already used',
      'AUTH_INVALID_EXCHANGE_CODE',
    );
    this.name = 'InvalidOrExpiredExchangeCodeException';
  }
}
