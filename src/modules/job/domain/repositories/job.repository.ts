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
  }): Promise<{ jobs: Job[]; total: number }>;
  abstract findAllByRecruiterPaginated(params: {
    recruiterId: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ jobs: Job[]; total: number }>;
  abstract findExpiredOpenJobs(): Promise<Job[]>;
  abstract incrementViewCount(id: string): Promise<void>;
  abstract save(job: Job): Promise<Job>;
  abstract update(job: Job): Promise<Job>;
  abstract delete(id: string): Promise<void>;
  /** Full-replace the job's skill assignments (no-op for an omitted/undefined list at call sites). */
  abstract setSkills(jobId: string, skillIds: string[]): Promise<void>;
}
