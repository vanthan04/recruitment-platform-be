import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationController } from '@/modules/notification/presentation/controllers/notification.controller';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationInfraRepository } from '@/modules/notification/infrastructure/repositories/notification.infra-repository';
import { NotificationPrismaRepository } from '@/modules/notification/infrastructure/persistence/prisma/notification-prisma.repository';
import { ApplicationEventsListener } from '@/modules/notification/infrastructure/listeners/application-events.listener';
import { INotificationService } from '@/modules/notification/domain/ports/notification.service.port';
import { NotificationService } from '@/modules/notification/infrastructure/services/notification.service';

import { CreateNotificationHandler } from '@/modules/notification/application/commands/create-notification.command';
import { MarkAsReadHandler } from '@/modules/notification/application/commands/mark-as-read.command';
import { MarkAllAsReadHandler } from '@/modules/notification/application/commands/mark-all-as-read.command';
import { ListMyNotificationsHandler } from '@/modules/notification/application/queries/list-my-notifications.query';

@Module({
  imports: [CqrsModule],
  controllers: [NotificationController],
  providers: [
    NotificationPrismaRepository,
    {
      provide: INotificationRepository,
      useClass: NotificationInfraRepository,
    },
    {
      provide: INotificationService,
      useClass: NotificationService,
    },
    CreateNotificationHandler,
    MarkAsReadHandler,
    MarkAllAsReadHandler,
    ListMyNotificationsHandler,
    ApplicationEventsListener,
  ],
  // Other modules that need to create a notification (e.g. `chat`) depend on
  // this token, not on CreateNotificationCommand directly.
  exports: [INotificationService],
})
export class NotificationModule {}
