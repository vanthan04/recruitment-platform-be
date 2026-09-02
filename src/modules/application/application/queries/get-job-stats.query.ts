import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
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
    if (!job) throw new EntityNotFoundException('Job', jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can view job stats',
    );

    const counts =
      await this.applicationRepository.countByJobIdGroupedByStatus(jobId);

    const dto = new JobStatsResponseDto();
    dto.jobId = jobId;
    dto.viewCount = job.viewCount;
    dto.pending = counts[ApplicationStatus.PENDING] ?? 0;
    dto.accepted = counts[ApplicationStatus.ACCEPTED] ?? 0;
    dto.rejected = counts[ApplicationStatus.REJECTED] ?? 0;
    dto.withdrawn = counts[ApplicationStatus.WITHDRAWN] ?? 0;
    dto.totalApplications =
      dto.pending + dto.accepted + dto.rejected + dto.withdrawn;

    return dto;
  }
}
