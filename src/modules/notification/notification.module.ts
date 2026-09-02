import { Module } from '@nestjs/common';
import { NotificationController } from '@/modules/notification/presentation/controllers/notification.controller';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationInfraRepository } from '@/modules/notification/infrastructure/repositories/notification.infra-repository';
import { NotificationPrismaRepository } from '@/modules/notification/infrastructure/persistence/prisma/notification-prisma.repository';
import { ApplicationEventsListener } from '@/modules/notification/infrastructure/listeners/application-events.listener';

import { CreateNotificationUseCase } from '@/modules/notification/application/use-cases/create-notification.use-case';
import { ListMyNotificationsUseCase } from '@/modules/notification/application/use-cases/list-my-notifications.use-case';
import { MarkAsReadUseCase } from '@/modules/notification/application/use-cases/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '@/modules/notification/application/use-cases/mark-all-as-read.use-case';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationPrismaRepository,
    {
      provide: INotificationRepository,
      useClass: NotificationInfraRepository,
    },
    CreateNotificationUseCase,
    ListMyNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    ApplicationEventsListener,
  ],
})
export class NotificationModule {}
