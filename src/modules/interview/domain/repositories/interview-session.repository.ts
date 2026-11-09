import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';

export abstract class IInterviewSessionRepository {
  abstract findById(id: string): Promise<InterviewSession | null>;
  /** Newest first. */
  abstract findByInterviewId(interviewId: string): Promise<InterviewSession[]>;
  abstract findOpenByInterviewId(
    interviewId: string,
  ): Promise<InterviewSession | null>;
  /**
   * Throws InterviewSessionAlreadyOpenException if another open session for
   * the same interview won a concurrent start (DB partial unique index).
   */
  abstract save(session: InterviewSession): Promise<InterviewSession>;
  abstract update(session: InterviewSession): Promise<InterviewSession>;
}
