import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';
export declare class MarkAsReadUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(userId: string, notificationId: string): Promise<NotificationResponseDto>;
}
