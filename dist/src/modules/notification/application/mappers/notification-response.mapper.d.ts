import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';
export declare class NotificationResponseMapper {
    static toDto(notification: Notification): NotificationResponseDto;
    static toDtoList(notifications: Notification[]): NotificationResponseDto[];
}
