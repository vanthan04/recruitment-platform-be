import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNotificationCommand } from '@/modules/notification/application/commands/create-notification.command';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
import {
  JOB_APPLIED_EVENT,
  JobAppliedEvent,
} from '@/modules/application/infrastructure/events/job-applied.event';
import {
  APPLICATION_STATUS_CHANGED_EVENT,
  ApplicationStatusChangedEvent,
} from '@/modules/application/infrastructure/events/application-status-changed.event';

@Injectable()
export class ApplicationEventsListener {
  private readonly logger = new Logger(ApplicationEventsListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(JOB_APPLIED_EVENT)
  async handleJobApplied(event: JobAppliedEvent): Promise<void> {
    // Notification creation is best-effort: the application itself already
    // committed and returned a response before this event fired. `emit()`
    // doesn't await listeners, so an uncaught rejection here becomes an
    // unhandled promise rejection — which crashes the whole process on
    // modern Node — over a failure in a side effect that should never take
    // the API down with it.
    try {
      await this.commandBus.execute(
        new CreateNotificationCommand(
          event.recruiterId,
          NotificationType.NEW_APPLICATION,
          'New job application',
          `You have a new application for "${event.jobTitle}"`,
          { applicationId: event.applicationId, jobId: event.jobId },
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed to create notification for ${JOB_APPLIED_EVENT} (application ${event.applicationId})`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  @OnEvent(APPLICATION_STATUS_CHANGED_EVENT)
  async handleApplicationStatusChanged(
    event: ApplicationStatusChangedEvent,
  ): Promise<void> {
    try {
      await this.commandBus.execute(
        new CreateNotificationCommand(
          event.candidateId,
          NotificationType.APPLICATION_STATUS_CHANGED,
          'Application status updated',
          `Your application for "${event.jobTitle}" is now ${event.status}`,
          {
            applicationId: event.applicationId,
            jobId: event.jobId,
            status: event.status,
          },
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed to create notification for ${APPLICATION_STATUS_CHANGED_EVENT} (application ${event.applicationId})`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
