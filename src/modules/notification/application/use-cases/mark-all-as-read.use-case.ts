import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';

@Injectable()
export class MarkAllAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
