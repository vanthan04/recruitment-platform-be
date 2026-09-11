import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { CreateApplicationStatusHistoryInput } from '@/modules/application/domain/repositories/application-status-history.repository';

export abstract class IJobApplicationRepository {
  abstract findById(id: string): Promise<JobApplication | null>;
  abstract findByIds(ids: string[]): Promise<JobApplication[]>;
  abstract findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<JobApplication | null>;
  abstract findAllByJobId(
    jobId: string,
    params: { skip: number; take: number },
  ): Promise<{ applications: JobApplication[]; total: number }>;
  abstract findAllByUserId(userId: string): Promise<JobApplication[]>;
  abstract save(application: JobApplication): Promise<JobApplication>;
  abstract update(application: JobApplication): Promise<JobApplication>;
  /**
   * Persists a status change and its audit-history entry atomically — use
   * this (not a separate `update` + history-repository `create`) whenever a
   * status transition needs a history row, so a mid-write failure can never
   * leave one without the other.
   */
  abstract updateWithStatusHistory(
    application: JobApplication,
    history: CreateApplicationStatusHistoryInput,
  ): Promise<JobApplication>;
  abstract countByJobIdGroupedByStatus(
    jobId: string,
  ): Promise<Record<string, number>>;
}
