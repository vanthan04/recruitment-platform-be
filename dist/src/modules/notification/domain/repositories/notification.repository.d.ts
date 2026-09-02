import { Notification } from '@/modules/notification/domain/entities/notification.entity';
export declare abstract class INotificationRepository {
    abstract findById(id: string): Promise<Notification | null>;
    abstract findAllByUserPaginated(userId: string, page: number, limit: number): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    abstract save(notification: Notification): Promise<Notification>;
    abstract update(notification: Notification): Promise<Notification>;
    abstract markAllAsRead(userId: string): Promise<void>;
}
