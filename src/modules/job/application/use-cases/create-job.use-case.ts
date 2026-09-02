import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
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

@Injectable()
export class CreateJobUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly userRepository: IUserRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(recruiterId: string, input: CreateJobInput): Promise<JobResponseDto> {
    const recruiter = await this.userRepository.findById(recruiterId);
    if (!recruiter?.companyId) {
      throw new BusinessRuleViolationException(
        'You must create a company profile before posting a job',
      );
    }

    if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
      throw new EntityNotFoundException('Category', input.categoryId);
    }

    const job = new Job({
      title: input.title,
      description: input.description,
      companyId: recruiter.companyId,
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
