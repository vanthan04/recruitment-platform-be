import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserLookupPort } from '@/modules/job/application/ports/user-lookup.port';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
import {
  BusinessRuleViolationException,
  EntityNotFoundException,
} from '@/common/exceptions/domain.exception';

export interface CreateJobInput {
  title: string;
  description: string;
  location: string;
  jobType?: string;
  level?: string;
  categoryId?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

export class CreateJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly input: CreateJobInput,
  ) {}
}

@Injectable()
@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<CreateJobCommand, JobResponseDto> {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly userLookup: IUserLookupPort,
    private readonly categoryLookup: ICategoryLookupPort,
  ) {}

  async execute({ recruiterId, input }: CreateJobCommand): Promise<JobResponseDto> {
    const companyId = await this.userLookup.getRecruiterCompanyId(recruiterId);
    if (!companyId) {
      throw new BusinessRuleViolationException(
        'You must create a company profile before posting a job',
      );
    }

    if (input.categoryId && !(await this.categoryLookup.exists(input.categoryId))) {
      throw new EntityNotFoundException('Category', input.categoryId);
    }

    const job = new Job({
      title: input.title,
      description: input.description,
      companyId,
      categoryId: input.categoryId ?? null,
      location: input.location,
      jobType: (input.jobType as JobType) ?? JobType.FULL_TIME,
      level: (input.level as JobLevel) ?? null,
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
