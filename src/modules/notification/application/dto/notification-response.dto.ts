import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

/**
 * Notification Response DTO — Application layer output.
 */
export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: Date | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}
