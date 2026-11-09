import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';

/**
 * An interview together with the context needed to authorize and display it.
 * `candidateId` / `recruiterId` come from the DB relations
 * (application.userId / job.postedById) — never from client input.
 */
export interface InterviewListItem {
  interview: InterviewSchedule;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string | null;
  recruiterId: string;
  applicationStatus: string;
}

export interface ListInterviewsFilter {
  userId: string;
  status?: InterviewStatus;
  /** Active (SCHEDULED/RESCHEDULED) and not yet started, soonest first. */
  upcoming?: boolean;
  page: number;
  limit: number;
}

/** Read side: cross-application, participant-scoped interview lookups. */
export abstract class IInterviewReadRepository {
  abstract findItemById(id: string): Promise<InterviewListItem | null>;
  /** Interviews where `userId` is the candidate or the job-owning recruiter. */
  abstract findForParticipant(
    filter: ListInterviewsFilter,
  ): Promise<{ items: InterviewListItem[]; total: number }>;
}
