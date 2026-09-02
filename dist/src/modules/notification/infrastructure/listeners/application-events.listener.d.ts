import { CreateNotificationUseCase } from '@/modules/notification/application/use-cases/create-notification.use-case';
import { JobAppliedEvent } from '@/modules/application/infrastructure/events/job-applied.event';
import { ApplicationStatusChangedEvent } from '@/modules/application/infrastructure/events/application-status-changed.event';
export declare class ApplicationEventsListener {
    private readonly createNotificationUseCase;
    constructor(createNotificationUseCase: CreateNotificationUseCase);
    handleJobApplied(event: JobAppliedEvent): Promise<void>;
    handleApplicationStatusChanged(event: ApplicationStatusChangedEvent): Promise<void>;
}
