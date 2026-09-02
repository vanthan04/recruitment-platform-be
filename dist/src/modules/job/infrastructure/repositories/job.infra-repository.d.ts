import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';
export declare class JobInfraRepository implements IJobRepository {
    private readonly jobPrisma;
    constructor(jobPrisma: JobPrismaRepository);
    findById(id: string): Promise<Job | null>;
    findAllPaginated(params: {
        page: number;
        limit: number;
        keyword?: string;
        location?: string;
        jobType?: string;
        salaryMin?: number;
        salaryMax?: number;
        companyId?: string;
        categoryId?: string;
        level?: string;
    }): Promise<{
        jobs: Job[];
        total: number;
    }>;
    findAllByRecruiter(recruiterId: string): Promise<Job[]>;
    findExpiredOpenJobs(): Promise<Job[]>;
    save(job: Job): Promise<Job>;
    update(job: Job): Promise<Job>;
    delete(id: string): Promise<void>;
    incrementViewCount(id: string): Promise<void>;
}
