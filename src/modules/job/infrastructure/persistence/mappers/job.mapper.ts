import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';

export class JobMapper {
  static toDomain(raw: any): Job | null {
    if (!raw) return null;

    return new Job({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      companyId: raw.companyId,
      company: raw.company
        ? { id: raw.company.id, name: raw.company.name, logoUrl: raw.company.logoUrl }
        : undefined,
      categoryId: raw.categoryId,
      category: raw.category
        ? { id: raw.category.id, name: raw.category.name, slug: raw.category.slug }
        : undefined,
      location: raw.location,
      jobType: raw.jobType as JobType,
      level: raw.level as JobLevel | null,
      status: raw.status as JobStatus,
      viewCount: raw.viewCount,
      salary: new SalaryRange(raw.salaryMin, raw.salaryMax, raw.currency),
      requirements: raw.requirements,
      benefits: raw.benefits,
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
      jobType: job.jobType,
      level: job.level,
      status: job.status,
      salaryMin: job.salary?.min,
      salaryMax: job.salary?.max,
      currency: job.salary?.currency,
      requirements: job.requirements,
      benefits: job.benefits,
      expiresAt: job.expiresAt,
      postedById: job.postedById,
      deletedAt: job.deletedAt,
    };
  }
}
