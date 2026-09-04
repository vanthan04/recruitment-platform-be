import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ReferencedJobNotFoundException } from '@/modules/application/domain/exceptions/application.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { JobStatsResponseDto } from '@/modules/application/application/dto/job-stats-response.dto';

export class GetJobStatsQuery {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetJobStatsQuery)
export class GetJobStatsHandler implements IQueryHandler<
  GetJobStatsQuery,
  JobStatsResponseDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    jobId,
  }: GetJobStatsQuery): Promise<JobStatsResponseDto> {
    const job = await this.jobLookupPort.findById(jobId);
    if (!job) throw new ReferencedJobNotFoundException(jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can view job stats',
      'APPLICATION_STATS_ACCESS_DENIED',
    );

    const counts =
      await this.applicationRepository.countByJobIdGroupedByStatus(jobId);

    const dto = new JobStatsResponseDto();
    dto.jobId = jobId;
    dto.viewCount = job.viewCount;
    dto.applied = counts[ApplicationStatus.APPLIED] ?? 0;
    dto.screening = counts[ApplicationStatus.SCREENING] ?? 0;
    dto.shortlisted = counts[ApplicationStatus.SHORTLISTED] ?? 0;
    dto.interview = counts[ApplicationStatus.INTERVIEW] ?? 0;
    dto.offer = counts[ApplicationStatus.OFFER] ?? 0;
    dto.hired = counts[ApplicationStatus.HIRED] ?? 0;
    dto.rejected = counts[ApplicationStatus.REJECTED] ?? 0;
    dto.withdrawn = counts[ApplicationStatus.WITHDRAWN] ?? 0;
    dto.totalApplications =
      dto.applied +
      dto.screening +
      dto.shortlisted +
      dto.interview +
      dto.offer +
      dto.hired +
      dto.rejected +
      dto.withdrawn;

    return dto;
  }
}
