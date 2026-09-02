import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '@/modules/notification/application/use-cases/create-notification.use-case';
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
  constructor(private readonly createNotificationUseCase: CreateNotificationUseCase) {}

  @OnEvent(JOB_APPLIED_EVENT)
  async handleJobApplied(event: JobAppliedEvent): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId: event.recruiterId,
      type: NotificationType.NEW_APPLICATION,
      title: 'New job application',
      message: `You have a new application for "${event.jobTitle}"`,
      metadata: { applicationId: event.applicationId, jobId: event.jobId },
    });
  }

  @OnEvent(APPLICATION_STATUS_CHANGED_EVENT)
  async handleApplicationStatusChanged(event: ApplicationStatusChangedEvent): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId: event.candidateId,
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      title: 'Application status updated',
      message: `Your application for "${event.jobTitle}" is now ${event.status}`,
      metadata: { applicationId: event.applicationId, jobId: event.jobId, status: event.status },
    });
  }
}
