import { Injectable, Logger } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

@Injectable()
export class GetJobUseCase {
  private readonly logger = new Logger(GetJobUseCase.name);

  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(jobId: string): Promise<JobResponseDto> {
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
