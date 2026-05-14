import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export interface CreateJobInput {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

@Injectable()
export class CreateJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(recruiterId: string, input: CreateJobInput): Promise<JobResponseDto> {
    const job = new Job({
      title: input.title,
      description: input.description,
      company: input.company,
      location: input.location,
      jobType: (input.jobType as JobType) ?? JobType.FULL_TIME,
      salary: new SalaryRange(
        input.salaryMin ?? null,
        input.salaryMax ?? null,
        input.currency ?? 'VND',
      ),
      requirements: input.requirements ?? null,
      benefits: input.benefits ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      postedById: recruiterId,
    });

    // Auto-open the job on creation
    job.open();

    const saved = await this.jobRepository.save(job);
    return JobResponseMapper.toDto(saved);
  }
}
