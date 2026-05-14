import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

@Injectable()
export class GetJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(jobId: string): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }
    return JobResponseMapper.toDto(job);
  }
}
