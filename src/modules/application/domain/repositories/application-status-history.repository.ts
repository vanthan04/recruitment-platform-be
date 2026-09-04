import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

export interface CreateApplicationStatusHistoryInput {
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedById: string | null;
  note: string | null;
}

/**
 * Append-only audit log for JobApplication status changes. No read methods
 * yet — nothing in this refactor exposes a "history" API endpoint, this
 * only satisfies "every status change must be recorded" (§14 of the
 * refactor brief). Add query methods here if/when a history view ships.
 */
export abstract class IApplicationStatusHistoryRepository {
  abstract create(input: CreateApplicationStatusHistoryInput): Promise<void>;
}
