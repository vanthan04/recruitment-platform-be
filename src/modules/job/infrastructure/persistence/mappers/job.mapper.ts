import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';

export class JobMapper {
  // `raw.company`/`raw.category` are attached by JobInfraRepository (via
  // ICompanyLookupPort/ICategoryLookupPort) after this mapping, never by a
  // Prisma include — this mapper only ever sees the job's own columns.
  static toDomain(raw: any): Job | null {
    if (!raw) return null;

    return new Job({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      companyId: raw.companyId,
      categoryId: raw.categoryId,
      location: raw.location,
      employmentType: raw.employmentType as EmploymentType,
      workMode: raw.workMode as WorkMode,
      level: raw.level as JobLevel | null,
      status: raw.status as JobStatus,
      viewCount: raw.viewCount,
      salary: new SalaryRange(raw.salaryMin, raw.salaryMax, raw.currency),
      requirements: raw.requirements,
      benefits: raw.benefits,
      extraInfo: raw.extraInfo,
      expiresAt: raw.expiresAt,
      postedById: raw.postedById,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(job: Job): any {
    return {
      title: job.title,
      description: job.description,
      companyId: job.companyId,
      categoryId: job.categoryId,
      location: job.location,
      employmentType: job.employmentType,
      workMode: job.workMode,
      level: job.level,
      status: job.status,
      salaryMin: job.salary?.min,
      salaryMax: job.salary?.max,
      currency: job.salary?.currency,
      requirements: job.requirements,
      benefits: job.benefits,
      extraInfo: job.extraInfo,
      expiresAt: job.expiresAt,
      postedById: job.postedById,
      deletedAt: job.deletedAt,
    };
  }
}
