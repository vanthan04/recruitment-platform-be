import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';

export abstract class IInterviewScheduleRepository {
  abstract findById(id: string): Promise<InterviewSchedule | null>;
  abstract findByApplicationId(
    jobApplicationId: string,
  ): Promise<InterviewSchedule[]>;
  abstract save(interview: InterviewSchedule): Promise<InterviewSchedule>;
  abstract update(interview: InterviewSchedule): Promise<InterviewSchedule>;

  /**
   * Active (SCHEDULED/RESCHEDULED) interviews that start in `(from, to]` and
   * have not had their reminder sent, soonest first, at most `limit`. A cheap
   * superset — whether a reminder is actually due *now* is
   * `InterviewSchedule.isReminderDue`.
   */
  abstract findUnremindedStartingBetween(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<InterviewSchedule[]>;

  /**
   * Atomically marks the reminder as sent, returning whether *this* caller
   * won. Succeeds only if the interview is still active, still unreminded and
   * still at the `scheduledAt` the caller looked at — so two overlapping
   * instances can't both send, and a reschedule that lands in between is not
   * swallowed (the new time stays eligible).
   */
  abstract claimReminder(
    id: string,
    scheduledAt: Date,
    at: Date,
  ): Promise<boolean>;
}
