import { BaseEntity } from '@/common/domain/base.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

/**
 * Notification Aggregate Root.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;

  constructor(partial: Partial<Notification>) {
    super();
    Object.assign(this, partial);
    this.isRead = partial.isRead ?? false;
    this.metadata = partial.metadata ?? null;
  }

  markAsRead(): void {
    if (this.isRead) {
      throw new BusinessRuleViolationException('Notification is already read');
    }
    this.isRead = true;
  }
}
