import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import {
  APPLICATION_STATUS_CHANGED_EVENT,
  ApplicationStatusChangedEvent,
} from '@/modules/application/infrastructure/events/application-status-changed.event';

@Injectable()
export class UpdateApplicationStatusUseCase {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobRepository: IJobRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    recruiterId: string,
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) throw new EntityNotFoundException('Application', applicationId);

    const job = await this.jobRepository.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    // Only the recruiter who posted the job can update application status
    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can update status');
    }

    if (status === ApplicationStatus.ACCEPTED) {
      application.accept();
    } else if (status === ApplicationStatus.REJECTED) {
      application.reject();
    }

    const updated = await this.applicationRepository.update(application);

    this.eventEmitter.emit(
      APPLICATION_STATUS_CHANGED_EVENT,
      new ApplicationStatusChangedEvent(updated.id, updated.userId, job.id, job.title, updated.status),
    );

    return ApplicationResponseMapper.toDto(updated);
  }
}
