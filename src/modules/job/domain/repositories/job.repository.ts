import { Job } from '@/modules/job/domain/entities/job.entity';

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
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
  }): Promise<{ jobs: Job[]; total: number }>;
  abstract findAllByRecruiter(recruiterId: string): Promise<Job[]>;
  abstract save(job: Job): Promise<Job>;
  abstract update(job: Job): Promise<Job>;
  abstract delete(id: string): Promise<void>;
}
