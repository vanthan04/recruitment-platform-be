import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';

export class MarkAllAsReadCommand {
  constructor(public readonly userId: string) {}
}

@Injectable()
@CommandHandler(MarkAllAsReadCommand)
export class MarkAllAsReadHandler implements ICommandHandler<MarkAllAsReadCommand, void> {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute({ userId }: MarkAllAsReadCommand): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
