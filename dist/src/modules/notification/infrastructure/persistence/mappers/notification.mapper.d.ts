import { Notification } from '@/modules/notification/domain/entities/notification.entity';
export declare class NotificationMapper {
    static toDomain(raw: any): Notification | null;
    static toPersistence(notification: Notification): any;
}
