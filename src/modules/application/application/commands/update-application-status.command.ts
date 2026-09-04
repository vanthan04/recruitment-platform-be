import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationStatusHistoryRepository } from '@/modules/application/domain/repositories/application-status-history.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import {
  JobApplicationNotFoundException,
  ReferencedJobNotFoundException,
} from '@/modules/application/domain/exceptions/application.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import {
  APPLICATION_STATUS_CHANGED_EVENT,
  ApplicationStatusChangedEvent,
} from '@/modules/application/infrastructure/events/application-status-changed.event';

export class UpdateApplicationStatusCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
    public readonly status: ApplicationStatus,
    public readonly note?: string,
  ) {}
}

@Injectable()
@CommandHandler(UpdateApplicationStatusCommand)
export class UpdateApplicationStatusHandler implements ICommandHandler<
  UpdateApplicationStatusCommand,
  ApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobLookupPort: IJobLookupPort,
    private readonly statusHistoryRepository: IApplicationStatusHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    recruiterId,
    applicationId,
    status,
    note,
  }: UpdateApplicationStatusCommand): Promise<ApplicationResponseDto> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) throw new JobApplicationNotFoundException(applicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new ReferencedJobNotFoundException(application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can update status',
      'APPLICATION_STATUS_UPDATE_ACCESS_DENIED',
    );

    const fromStatus = application.status;
    application.transitionTo(status);

    const updated = await this.applicationRepository.update(application);

    await this.statusHistoryRepository.create({
      applicationId: updated.id,
      fromStatus,
      toStatus: updated.status,
      changedById: recruiterId,
      note: note ?? null,
    });

    this.eventEmitter.emit(
      APPLICATION_STATUS_CHANGED_EVENT,
      new ApplicationStatusChangedEvent(
        updated.id,
        updated.userId,
        job.id,
        job.title,
        updated.status,
      ),
    );

    return ApplicationResponseMapper.toDto(updated);
  }
}
