import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ICvLookupPort } from '@/modules/application/application/ports/cv-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import {
  ReferencedJobNotFoundException,
  ReferencedCvNotFoundException,
  JobNotAcceptingApplicationsException,
  JobPostingExpiredException,
  JobPostingRemovedException,
  CvNotPublishedException,
  ReferencedCvDeletedException,
  CvOwnershipException,
  AlreadyAppliedException,
} from '@/modules/application/domain/exceptions/application.exceptions';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import {
  JOB_APPLIED_EVENT,
  JobAppliedEvent,
} from '@/modules/application/infrastructure/events/job-applied.event';

export interface ApplyJobInput {
  jobId: string;
  cvId: string;
  coverLetter?: string;
}

export class ApplyJobCommand {
  constructor(
    public readonly userId: string,
    public readonly input: ApplyJobInput,
  ) {}
}

@Injectable()
@CommandHandler(ApplyJobCommand)
export class ApplyJobHandler implements ICommandHandler<
  ApplyJobCommand,
  ApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobLookupPort: IJobLookupPort,
    private readonly cvLookupPort: ICvLookupPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    userId,
    input,
  }: ApplyJobCommand): Promise<ApplicationResponseDto> {
    const [job, cv] = await Promise.all([
      this.jobLookupPort.findById(input.jobId),
      this.cvLookupPort.findById(input.cvId),
    ]);

    if (!job) throw new ReferencedJobNotFoundException(input.jobId);
    if (!cv) throw new ReferencedCvNotFoundException(input.cvId);

    // Domain validations (job accepting applications)
    if (!job.isOpen) {
      throw new JobNotAcceptingApplicationsException();
    }
    if (job.isExpired) {
      throw new JobPostingExpiredException();
    }
    if (job.isDeleted) {
      throw new JobPostingRemovedException();
    }

    // Domain validations (CV ready for application)
    if (!cv.isPublished) {
      throw new CvNotPublishedException();
    }
    if (cv.isDeleted) {
      throw new ReferencedCvDeletedException();
    }
    if (cv.userId !== userId) {
      throw new CvOwnershipException();
    }

    const existing = await this.applicationRepository.findByUserIdAndJobId(
      userId,
      input.jobId,
    );
    if (existing) {
      throw new AlreadyAppliedException();
    }

    const application = new JobApplication({
      userId,
      jobId: input.jobId,
      cvId: input.cvId,
      coverLetter: input.coverLetter ?? null,
    });

    const saved = await this.applicationRepository.save(application);

    this.eventEmitter.emit(
      JOB_APPLIED_EVENT,
      new JobAppliedEvent(
        saved.id,
        userId,
        input.jobId,
        input.cvId,
        job.postedById,
        job.title,
      ),
    );

    return ApplicationResponseMapper.toDto(saved);
  }
}
