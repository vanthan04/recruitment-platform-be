import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { JobDomainService } from '@/modules/job/domain/domain-services/job-domain.service';
import { CvDomainService } from '@/modules/cv/domain/domain-services/cv-domain.service';
import { EntityNotFoundException, DuplicateEntityException } from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { JOB_APPLIED_EVENT, JobAppliedEvent } from '@/modules/application/infrastructure/events/job-applied.event';

export interface ApplyJobInput {
  jobId: string;
  cvId: string;
  coverLetter?: string;
}

@Injectable()
export class ApplyJobUseCase {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobRepository: IJobRepository,
    private readonly cvRepository: ICvRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, input: ApplyJobInput): Promise<ApplicationResponseDto> {
    const [job, cv] = await Promise.all([
      this.jobRepository.findById(input.jobId),
      this.cvRepository.findById(input.cvId),
    ]);

    if (!job) throw new EntityNotFoundException('Job', input.jobId);
    if (!cv) throw new EntityNotFoundException('CV', input.cvId);

    // Domain Validations
    JobDomainService.validateAcceptingApplications(job);
    CvDomainService.validateForApplication(cv);
    cv.ensureOwner(userId);

    // Check for duplicate application
    const existing = await this.applicationRepository.findByUserIdAndJobId(userId, input.jobId);
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
      new JobAppliedEvent(saved.id, userId, input.jobId, input.cvId, job.postedById, job.title),
    );

    return ApplicationResponseMapper.toDto(saved);
  }
}
