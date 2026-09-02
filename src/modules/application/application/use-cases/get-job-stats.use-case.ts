import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { JobStatsResponseDto } from '@/modules/application/application/dto/job-stats-response.dto';

@Injectable()
export class GetJobStatsUseCase {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobRepository: IJobRepository,
  ) {}

  async execute(recruiterId: string, jobId: string): Promise<JobStatsResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) throw new EntityNotFoundException('Job', jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can view job stats');
    }

    const counts = await this.applicationRepository.countByJobIdGroupedByStatus(jobId);

    const dto = new JobStatsResponseDto();
    dto.jobId = jobId;
    dto.viewCount = job.viewCount;
    dto.pending = counts[ApplicationStatus.PENDING] ?? 0;
    dto.accepted = counts[ApplicationStatus.ACCEPTED] ?? 0;
    dto.rejected = counts[ApplicationStatus.REJECTED] ?? 0;
    dto.withdrawn = counts[ApplicationStatus.WITHDRAWN] ?? 0;
    dto.totalApplications = dto.pending + dto.accepted + dto.rejected + dto.withdrawn;

    return dto;
  }
}
