import { Injectable } from '@nestjs/common';
import {
  IChatNotificationPort,
  ChatNotificationMetadata,
} from '@/modules/chat/application/ports/chat-notification.port';
import { INotificationService } from '@/modules/notification/domain/ports/notification.service.port';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

@Injectable()
export class ChatNotificationAdapter implements IChatNotificationPort {
  constructor(private readonly notificationService: INotificationService) {}

  async notifyNewMessage(
    recipientId: string,
    title: string,
    message: string,
    metadata: ChatNotificationMetadata,
  ): Promise<void> {
    await this.notificationService.notify({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title,
      message,
      metadata,
    });
  }
}
