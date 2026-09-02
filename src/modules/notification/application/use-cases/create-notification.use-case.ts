import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Internal use-case — called by event listeners, not exposed via controller.
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<void> {
    const notification = new Notification({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? null,
    });

    await this.notificationRepository.save(notification);
  }
}
