import { BaseEntity } from '@/common/domain/base.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
export declare class Notification extends BaseEntity {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, any> | null;
    constructor(partial: Partial<Notification>);
    markAsRead(): void;
}
