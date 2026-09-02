import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationResponseMapper } from '@/modules/notification/application/mappers/notification-response.mapper';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';

export class ListMyNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

export interface ListMyNotificationsResult {
  notifications: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(ListMyNotificationsQuery)
export class ListMyNotificationsHandler implements IQueryHandler<
  ListMyNotificationsQuery,
  ListMyNotificationsResult
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute({
    userId,
    page,
    limit,
  }: ListMyNotificationsQuery): Promise<ListMyNotificationsResult> {
    const { notifications, total } =
      await this.notificationRepository.findAllByUserPaginated(
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
