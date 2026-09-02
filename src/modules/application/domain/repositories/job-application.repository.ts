import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';

export abstract class IJobApplicationRepository {
  abstract findById(id: string): Promise<JobApplication | null>;
  abstract findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<JobApplication | null>;
  abstract findAllByJobId(jobId: string): Promise<JobApplication[]>;
  abstract findAllByUserId(userId: string): Promise<JobApplication[]>;
  abstract save(application: JobApplication): Promise<JobApplication>;
  abstract update(application: JobApplication): Promise<JobApplication>;
  abstract countByJobIdGroupedByStatus(
    jobId: string,
  ): Promise<Record<string, number>>;
}
