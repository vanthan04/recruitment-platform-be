import {
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

/**
 * Notification-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class NotificationNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Notification', id, 'NOTIFICATION_NOT_FOUND');
    this.name = 'NotificationNotFoundException';
  }
}

export class NotificationAlreadyReadException extends BusinessRuleViolationException {
  constructor() {
    super('Notification is already read', 'NOTIFICATION_ALREADY_READ');
    this.name = 'NotificationAlreadyReadException';
  }
}
