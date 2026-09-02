import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  jobType?: string;
  level?: string;
  categoryId?: string | null;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

@Injectable()
export class UpdateJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    recruiterId: string,
    jobId: string,
    input: UpdateJobInput,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }

    // Domain guard
    job.ensureOwner(recruiterId);

    if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
      throw new EntityNotFoundException('Category', input.categoryId);
    }

    // Domain method handles update
    job.updateDetails({
      title: input.title,
      description: input.description,
      location: input.location,
      jobType: input.jobType as JobType,
      level: input.level !== undefined ? (input.level as JobLevel) : undefined,
      categoryId: input.categoryId,
      requirements: input.requirements,
      benefits: input.benefits,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      currency: input.currency,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    const updated = await this.jobRepository.update(job);
    return JobResponseMapper.toDto(updated);
  }
}
