import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
}
export declare class CreateNotificationUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(input: CreateNotificationInput): Promise<void>;
}
