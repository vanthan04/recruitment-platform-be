import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationPrismaRepository } from '@/modules/notification/infrastructure/persistence/prisma/notification-prisma.repository';
export declare class NotificationInfraRepository implements INotificationRepository {
    private readonly notificationPrisma;
    constructor(notificationPrisma: NotificationPrismaRepository);
    findById(id: string): Promise<Notification | null>;
    findAllByUserPaginated(userId: string, page: number, limit: number): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    save(notification: Notification): Promise<Notification>;
    update(notification: Notification): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
}
