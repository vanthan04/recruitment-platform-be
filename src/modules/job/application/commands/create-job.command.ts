import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserLookupPort } from '@/modules/job/application/ports/user-lookup.port';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { ISkillLookupPort } from '@/modules/job/application/ports/skill-lookup.port';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
import {
  CompanyProfileRequiredException,
  JobCategoryNotFoundException,
  JobSkillNotFoundException,
} from '@/modules/job/domain/exceptions/job.exceptions';

export interface CreateJobInput {
  title: string;
  description: string;
  location: string;
  employmentType?: string;
  workMode?: string;
  level?: string;
  categoryId?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  workingHours?: string;
  applicationMethod?: string;
  expiresAt?: string;
  skillIds?: string[];
}

export class CreateJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly input: CreateJobInput,
  ) {}
}

@Injectable()
@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<
  CreateJobCommand,
  JobResponseDto
> {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly userLookup: IUserLookupPort,
    private readonly categoryLookup: ICategoryLookupPort,
    private readonly skillLookup: ISkillLookupPort,
  ) {}

  async execute({
    recruiterId,
    input,
  }: CreateJobCommand): Promise<JobResponseDto> {
    const companyId = await this.userLookup.getRecruiterCompanyId(recruiterId);
    if (!companyId) {
      throw new CompanyProfileRequiredException();
    }

    if (
      input.categoryId &&
      !(await this.categoryLookup.exists(input.categoryId))
    ) {
      throw new JobCategoryNotFoundException(input.categoryId);
    }

    const skillIds = [...new Set(input.skillIds ?? [])];
    if (skillIds.length > 0) {
      const found = await this.skillLookup.findManyByIds(skillIds);
      const missing = skillIds.filter((id) => !found.has(id));
      if (missing.length > 0) {
        throw new JobSkillNotFoundException(missing.join(', '));
      }
    }

    const job = new Job({
      title: input.title,
      description: input.description,
      companyId,
      categoryId: input.categoryId ?? null,
      location: input.location,
      employmentType:
        (input.employmentType as EmploymentType) ?? EmploymentType.FULL_TIME,
      workMode: (input.workMode as WorkMode) ?? WorkMode.ONSITE,
      level: (input.level as JobLevel) ?? null,
      salary: new SalaryRange(
        input.salaryMin ?? null,
        input.salaryMax ?? null,
        input.currency ?? 'VND',
      ),
      requirements: input.requirements ?? null,
      benefits: input.benefits ?? null,
      workingHours: input.workingHours ?? null,
      applicationMethod: input.applicationMethod ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      postedById: recruiterId,
    });

    // Auto-open the job on creation
    job.open();

    const saved = await this.jobRepository.save(
      job,
      skillIds.length > 0 ? skillIds : undefined,
    );

    return JobResponseMapper.toDto(saved);
  }
}
