import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { JobApplicationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/job-application-prisma.repository';
export declare class JobApplicationInfraRepository implements IJobApplicationRepository {
    private readonly applicationPrisma;
    constructor(applicationPrisma: JobApplicationPrismaRepository);
    findById(id: string): Promise<JobApplication | null>;
    findByUserIdAndJobId(userId: string, jobId: string): Promise<JobApplication | null>;
    findAllByJobId(jobId: string): Promise<JobApplication[]>;
    findAllByUserId(userId: string): Promise<JobApplication[]>;
    save(application: JobApplication): Promise<JobApplication>;
    update(application: JobApplication): Promise<JobApplication>;
}
