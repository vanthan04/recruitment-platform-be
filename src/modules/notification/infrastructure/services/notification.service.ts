import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  INotificationService,
  NotifyInput,
} from '@/modules/notification/domain/ports/notification.service.port';
import { CreateNotificationCommand } from '@/modules/notification/application/commands/create-notification.command';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(private readonly commandBus: CommandBus) {}

  async notify(input: NotifyInput): Promise<void> {
    await this.commandBus.execute(
      new CreateNotificationCommand(
        input.userId,
        input.type,
        input.title,
        input.message,
        input.metadata,
      ),
    );
  }
}
