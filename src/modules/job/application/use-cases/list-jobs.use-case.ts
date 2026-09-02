import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export interface ListJobsInput {
  page: number;
  limit: number;
  keyword?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  companyId?: string;
  categoryId?: string;
  level?: string;
}

@Injectable()
export class ListJobsUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(
    input: ListJobsInput,
  ): Promise<{ jobs: JobResponseDto[]; total: number; page: number; limit: number }> {
    const { jobs, total } = await this.jobRepository.findAllPaginated(input);

    return {
      jobs: JobResponseMapper.toDtoList(jobs),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
