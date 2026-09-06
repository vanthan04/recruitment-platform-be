import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

/**
 * Internal command — dispatched by event listeners, not exposed via controller.
 */
export class CreateNotificationCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<
  CreateNotificationCommand,
  void
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<void> {
    const notification = new Notification({
      userId: command.userId,
      type: command.type,
      title: command.title,
      message: command.message,
      metadata: command.metadata ?? null,
    });

    await this.notificationRepository.save(notification);
  }
}
