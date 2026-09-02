import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { NotificationResponseMapper } from '@/modules/notification/application/mappers/notification-response.mapper';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';

@Injectable()
export class MarkAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new EntityNotFoundException('Notification', notificationId);
    }

    notification.markAsRead();

    const updated = await this.notificationRepository.update(notification);
    return NotificationResponseMapper.toDto(updated);
  }
}
