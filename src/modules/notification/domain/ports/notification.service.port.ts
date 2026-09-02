import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * What other modules are allowed to depend on to create a notification —
 * mirrors `IMailService` (mail module): a stable interface exported from
 * this module's own DI, so callers never need to know it's backed by
 * CommandBus/CreateNotificationCommand underneath.
 */
export abstract class INotificationService {
  abstract notify(input: NotifyInput): Promise<void>;
}
