import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';

export class JobMapper {
  static toDomain(raw: any): Job | null {
    if (!raw) return null;

    return new Job({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      company: raw.company,
      location: raw.location,
      jobType: raw.jobType as JobType,
      status: raw.status as JobStatus,
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
      company: job.company,
      location: job.location,
      jobType: job.jobType,
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
