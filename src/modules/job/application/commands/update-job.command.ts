import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { ISkillLookupPort } from '@/modules/job/application/ports/skill-lookup.port';
import {
  JobNotFoundException,
  JobCategoryNotFoundException,
  JobSkillNotFoundException,
} from '@/modules/job/domain/exceptions/job.exceptions';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  level?: string;
  categoryId?: string | null;
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
    private readonly skillLookup: ISkillLookupPort,
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

    let skillIds: string[] | undefined;
    if (input.skillIds !== undefined) {
      skillIds = [...new Set(input.skillIds)];
      if (skillIds.length > 0) {
        const found = await this.skillLookup.findManyByIds(skillIds);
        const missing = skillIds.filter((id) => !found.has(id));
        if (missing.length > 0) {
          throw new JobSkillNotFoundException(missing.join(', '));
        }
      }
    }

    job.updateDetails({
      title: input.title,
      description: input.description,
      location: input.location,
      employmentType: input.employmentType as EmploymentType,
      workMode: input.workMode as WorkMode,
      level: input.level !== undefined ? (input.level as JobLevel) : undefined,
      categoryId: input.categoryId,
      requirements: input.requirements,
      benefits: input.benefits,
      workingHours: input.workingHours,
      applicationMethod: input.applicationMethod,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      currency: input.currency,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    const updated = await this.jobRepository.update(job);

    if (skillIds !== undefined) {
      await this.jobRepository.setSkills(updated.id, skillIds);
    }

    const final =
      skillIds !== undefined
        ? await this.jobRepository.findById(updated.id)
        : updated;
    return JobResponseMapper.toDto(final!);
  }
}
