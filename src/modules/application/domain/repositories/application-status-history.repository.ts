import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

export interface CreateApplicationStatusHistoryInput {
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedById: string | null;
  note: string | null;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  changedById: string | null;
  createdAt: Date;
}

/**
 * Append-only audit log for JobApplication status changes.
 */
export abstract class IApplicationStatusHistoryRepository {
  abstract create(input: CreateApplicationStatusHistoryInput): Promise<void>;
  abstract findByApplicationId(
    applicationId: string,
  ): Promise<ApplicationStatusHistoryEntry[]>;
}
