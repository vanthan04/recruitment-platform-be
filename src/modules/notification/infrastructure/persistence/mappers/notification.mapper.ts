import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
import { Notification as PrismaNotification, Prisma } from '@prisma/client';

export class NotificationMapper {
  static toDomain(raw: PrismaNotification | null): Notification | null {
    if (!raw) return null;

    return new Notification({
      id: raw.id,
      userId: raw.userId,
      type: raw.type as NotificationType,
      title: raw.title,
      message: raw.message,
      readAt: raw.readAt,
      // Prisma's Json field is typed as `Prisma.JsonValue | null`, wider
      // than the domain's `Record<string, any> | null` (notifications only
      // ever store plain key/value payloads) — cast to the domain's own
      // declared type rather than widening it.
      metadata: raw.metadata as Notification['metadata'],
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(
    notification: Notification,
  ): Prisma.NotificationUncheckedCreateInput {
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
