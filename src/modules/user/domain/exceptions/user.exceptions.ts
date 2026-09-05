import {
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

/**
 * User-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class UserNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('User', id, 'USER_NOT_FOUND');
    this.name = 'UserNotFoundException';
  }
}

export class CannotModifyOwnAccountException extends BusinessRuleViolationException {
  constructor() {
    super(
      "Admins cannot change their own status or role — ask another admin to do it",
      'USER_CANNOT_MODIFY_OWN_ACCOUNT',
    );
    this.name = 'CannotModifyOwnAccountException';
  }
}

export class CannotRemoveLastAdminException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Cannot block or demote the last active admin account',
      'USER_CANNOT_REMOVE_LAST_ADMIN',
    );
    this.name = 'CannotRemoveLastAdminException';
  }
}
