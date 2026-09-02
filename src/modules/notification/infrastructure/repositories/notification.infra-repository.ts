import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationPrismaRepository } from '@/modules/notification/infrastructure/persistence/prisma/notification-prisma.repository';
import { NotificationMapper } from '@/modules/notification/infrastructure/persistence/mappers/notification.mapper';

@Injectable()
export class NotificationInfraRepository implements INotificationRepository {
  constructor(
    private readonly notificationPrisma: NotificationPrismaRepository,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const raw = await this.notificationPrisma.findById(id);
    return NotificationMapper.toDomain(raw);
  }

  async findAllByUserPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit;
    const { notifications: raws, total } =
      await this.notificationPrisma.findAllByUserPaginated(userId, skip, limit);

    return {
      notifications: raws.map((r) => NotificationMapper.toDomain(r)!),
      total,
    };
  }

  async save(notification: Notification): Promise<Notification> {
    const data = NotificationMapper.toPersistence(notification);
    const raw = await this.notificationPrisma.create(data);
    return NotificationMapper.toDomain(raw)!;
  }

  async update(notification: Notification): Promise<Notification> {
    const data = NotificationMapper.toPersistence(notification);
    const raw = await this.notificationPrisma.update(notification.id, data);
    return NotificationMapper.toDomain(raw)!;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationPrisma.markAllAsRead(userId);
  }
}
