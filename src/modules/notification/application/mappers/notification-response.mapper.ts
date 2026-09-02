import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';

export class NotificationResponseMapper {
  static toDto(notification: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = notification.id;
    dto.type = notification.type;
    dto.title = notification.title;
    dto.message = notification.message;
    dto.isRead = notification.isRead;
    dto.metadata = notification.metadata;
    dto.createdAt = notification.createdAt;
    return dto;
  }

  static toDtoList(notifications: Notification[]): NotificationResponseDto[] {
    return notifications.map(NotificationResponseMapper.toDto);
  }
}
