import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ICvLookupPort } from '@/modules/application/application/ports/cv-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import {
  EntityNotFoundException,
  DuplicateEntityException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';
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

    if (!job) throw new EntityNotFoundException('Job', input.jobId);
    if (!cv) throw new EntityNotFoundException('CV', input.cvId);

    // Domain validations (job accepting applications)
    if (!job.isOpen) {
      throw new BusinessRuleViolationException(
        'This job is not currently accepting applications',
      );
    }
    if (job.isExpired) {
      throw new BusinessRuleViolationException('This job posting has expired');
    }
    if (job.isDeleted) {
      throw new BusinessRuleViolationException(
        'This job posting has been removed',
      );
    }

    // Domain validations (CV ready for application)
    if (!cv.isPublished) {
      throw new BusinessRuleViolationException(
        'Only published CVs can be used for job applications',
      );
    }
    if (cv.isDeleted) {
      throw new BusinessRuleViolationException(
        'Deleted CVs cannot be used for job applications',
      );
    }
    if (cv.userId !== userId) {
      throw new UnauthorizedDomainException('You are not the owner of this CV');
    }

    const existing = await this.applicationRepository.findByUserIdAndJobId(
      userId,
      input.jobId,
    );
    if (existing) {
      throw new DuplicateEntityException('Application', 'jobId');
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
