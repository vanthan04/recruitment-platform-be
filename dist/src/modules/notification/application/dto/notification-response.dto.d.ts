import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
export declare class NotificationResponseDto {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, any> | null;
    createdAt: Date;
}
