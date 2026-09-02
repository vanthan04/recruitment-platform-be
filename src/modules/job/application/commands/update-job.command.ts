import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import {
  JobNotFoundException,
  JobCategoryNotFoundException,
} from '@/modules/job/domain/exceptions/job.exceptions';
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

export class UpdateJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
    public readonly input: UpdateJobInput,
  ) {}
}

@Injectable()
@CommandHandler(UpdateJobCommand)
export class UpdateJobHandler implements ICommandHandler<
  UpdateJobCommand,
  JobResponseDto
> {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly categoryLookup: ICategoryLookupPort,
  ) {}

  async execute({
    recruiterId,
    jobId,
    input,
  }: UpdateJobCommand): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new JobNotFoundException(jobId);
    }

    job.ensureOwner(recruiterId);

    if (
      input.categoryId &&
      !(await this.categoryLookup.exists(input.categoryId))
    ) {
      throw new JobCategoryNotFoundException(input.categoryId);
    }

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
