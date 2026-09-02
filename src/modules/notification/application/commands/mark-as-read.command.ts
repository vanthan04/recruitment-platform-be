import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationNotFoundException } from '@/modules/notification/domain/exceptions/notification.exceptions';
import { NotificationResponseMapper } from '@/modules/notification/application/mappers/notification-response.mapper';
import { NotificationResponseDto } from '@/modules/notification/application/dto/notification-response.dto';

export class MarkAsReadCommand {
  constructor(
    public readonly userId: string,
    public readonly notificationId: string,
  ) {}
}

@Injectable()
@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<
  MarkAsReadCommand,
  NotificationResponseDto
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute({
    userId,
    notificationId,
  }: MarkAsReadCommand): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotificationNotFoundException(notificationId);
    }

    notification.markAsRead();

    const updated = await this.notificationRepository.update(notification);
    return NotificationResponseMapper.toDto(updated);
  }
}
