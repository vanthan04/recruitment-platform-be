import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export class GetJobQuery {
  constructor(public readonly jobId: string) {}
}

@Injectable()
@QueryHandler(GetJobQuery)
export class GetJobHandler implements IQueryHandler<GetJobQuery, JobResponseDto> {
  private readonly logger = new Logger(GetJobHandler.name);

  constructor(private readonly jobRepository: IJobRepository) {}

  async execute({ jobId }: GetJobQuery): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }

    // Fire-and-forget — view count is analytics data, must not block the response.
    this.jobRepository
      .incrementViewCount(jobId)
      .catch((err) => this.logger.error('Failed to increment job view count', err));

    return JobResponseMapper.toDto(job);
  }
}
