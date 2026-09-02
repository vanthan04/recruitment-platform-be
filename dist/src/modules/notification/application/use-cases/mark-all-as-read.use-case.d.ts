import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
export declare class MarkAllAsReadUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(userId: string): Promise<void>;
}
