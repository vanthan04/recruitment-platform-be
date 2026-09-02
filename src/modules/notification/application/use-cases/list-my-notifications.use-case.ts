import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationResponseMapper } from '@/modules/notification/application/mappers/notification-response.mapper';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number; page: number; limit: number }> {
    const { notifications, total } = await this.notificationRepository.findAllByUserPaginated(
      userId,
      page,
      limit,
    );

    return {
      notifications: NotificationResponseMapper.toDtoList(notifications),
      total,
      page,
      limit,
    };
  }
}
