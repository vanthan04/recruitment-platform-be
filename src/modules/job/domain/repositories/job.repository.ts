import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobSortOption } from '@/modules/job/domain/value-objects/job-sort-option.vo';

/**
 * Job Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 */
export abstract class IJobRepository {
  abstract findById(id: string): Promise<Job | null>;
  abstract findAllPaginated(params: {
    page: number;
    limit: number;
    keyword?: string;
    location?: string;
    employmentType?: string;
    workMode?: string;
    salaryMin?: number;
    salaryMax?: number;
    companyId?: string;
    categoryId?: string;
    level?: string;
    sort?: JobSortOption;
    createdAfter?: Date;
  }): Promise<{ jobs: Job[]; total: number }>;
  abstract findAllByRecruiterPaginated(params: {
    recruiterId: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ jobs: Job[]; total: number }>;
  abstract findExpiredOpenJobs(): Promise<Job[]>;
  abstract incrementViewCount(id: string): Promise<void>;
  /**
   * `skillIds`, when provided, replaces the job's skill tags in the same
   * transaction as the job write itself — omit it to leave skills untouched.
   */
  abstract save(job: Job, skillIds?: string[]): Promise<Job>;
  abstract update(job: Job, skillIds?: string[]): Promise<Job>;
  abstract delete(id: string): Promise<void>;
}
