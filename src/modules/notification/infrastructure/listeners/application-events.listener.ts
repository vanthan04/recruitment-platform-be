import { Injectable } from '@nestjs/common';
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
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(JOB_APPLIED_EVENT)
  async handleJobApplied(event: JobAppliedEvent): Promise<void> {
    await this.commandBus.execute(
      new CreateNotificationCommand(
        event.recruiterId,
        NotificationType.NEW_APPLICATION,
        'New job application',
        `You have a new application for "${event.jobTitle}"`,
        { applicationId: event.applicationId, jobId: event.jobId },
      ),
    );
  }

  @OnEvent(APPLICATION_STATUS_CHANGED_EVENT)
  async handleApplicationStatusChanged(event: ApplicationStatusChangedEvent): Promise<void> {
    await this.commandBus.execute(
      new CreateNotificationCommand(
        event.candidateId,
        NotificationType.APPLICATION_STATUS_CHANGED,
        'Application status updated',
        `Your application for "${event.jobTitle}" is now ${event.status}`,
        { applicationId: event.applicationId, jobId: event.jobId, status: event.status },
      ),
    );
  }
}
