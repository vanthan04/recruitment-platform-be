import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

export class NotificationMapper {
  static toDomain(raw: any): Notification | null {
    if (!raw) return null;

    return new Notification({
      id: raw.id,
      userId: raw.userId,
      type: raw.type as NotificationType,
      title: raw.title,
      message: raw.message,
      readAt: raw.readAt,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(notification: Notification): any {
    return {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      readAt: notification.readAt,
      metadata: notification.metadata ?? undefined,
    };
  }
}
