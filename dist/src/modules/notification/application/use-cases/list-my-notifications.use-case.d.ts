import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';
export declare class ListMyNotificationsUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(userId: string, page: number, limit: number): Promise<{
        notifications: NotificationResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
