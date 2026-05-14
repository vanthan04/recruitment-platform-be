import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';

export interface UpdateJobInput {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

@Injectable()
export class UpdateJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

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

    // Domain method handles update
    job.updateDetails({
      title: input.title,
      description: input.description,
      company: input.company,
      location: input.location,
      jobType: input.jobType as JobType,
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
