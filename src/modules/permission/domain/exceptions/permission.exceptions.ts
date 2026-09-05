import {
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

/**
 * Permission-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class RoleNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Role', id, 'ROLE_NOT_FOUND');
    this.name = 'RoleNotFoundException';
  }
}

export class PermissionNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Permission', id, 'PERMISSION_NOT_FOUND');
    this.name = 'PermissionNotFoundException';
  }
}

export class CannotRemoveLastRbacAdminPermissionException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Cannot remove role:permission:manage — no role would be left able to administer RBAC',
      'CANNOT_REMOVE_LAST_RBAC_ADMIN_PERMISSION',
    );
    this.name = 'CannotRemoveLastRbacAdminPermissionException';
  }
}
