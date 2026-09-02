import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import {
  APPLICATION_STATUS_CHANGED_EVENT,
  ApplicationStatusChangedEvent,
} from '@/modules/application/infrastructure/events/application-status-changed.event';

export class UpdateApplicationStatusCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
    public readonly status: ApplicationStatus,
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    recruiterId,
    applicationId,
    status,
  }: UpdateApplicationStatusCommand): Promise<ApplicationResponseDto> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application)
      throw new EntityNotFoundException('Application', applicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can update status',
    );

    if (status === ApplicationStatus.ACCEPTED) {
      application.accept();
    } else if (status === ApplicationStatus.REJECTED) {
      application.reject();
    }

    const updated = await this.applicationRepository.update(application);

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
