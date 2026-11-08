import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import {
  InterviewSchedule,
  INTERVIEW_REMINDER_LEAD_MS,
} from '@/modules/interview/domain/entities/interview-schedule.entity';
import { buildInterviewReminderEmail } from '@/modules/interview/application/utils/interview-mail.util';
import { isApplicationInterviewable } from '@/modules/interview/application/utils/ensure-application-interviewable.util';

/** Upper bound per run. Runs are frequent, so anything beyond is picked up on the next one. */
const BATCH_SIZE = 200;

export interface SendInterviewRemindersResult {
  /** Interviews in the next 24h that had no reminder yet. */
  considered: number;
  /** Interviews a reminder was actually sent for. */
  reminded: number;
}

/** Internal command — dispatched by SendInterviewRemindersCron, not exposed via a controller. */
export class SendInterviewRemindersCommand extends Command<SendInterviewRemindersResult> {
  constructor(public readonly now: Date = new Date()) {
    super();
  }
}

@Injectable()
@CommandHandler(SendInterviewRemindersCommand)
export class SendInterviewRemindersHandler implements ICommandHandler<
  SendInterviewRemindersCommand,
  SendInterviewRemindersResult
> {
  private readonly logger = new Logger(SendInterviewRemindersHandler.name);

  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
    private readonly userLookupPort: IInterviewUserLookupPort,
    private readonly mailPort: IInterviewMailPort,
  ) {}

  async execute({
    now,
  }: SendInterviewRemindersCommand): Promise<SendInterviewRemindersResult> {
    const until = new Date(now.getTime() + INTERVIEW_REMINDER_LEAD_MS);
    const interviews =
      await this.interviewRepository.findUnremindedStartingBetween(
        now,
        until,
        BATCH_SIZE,
      );

    let reminded = 0;
    for (const interview of interviews) {
      // One bad interview (a lookup that throws, say) must not stop the
      // reminders for everyone after it in the batch.
      try {
        if (await this.remind(interview, now)) reminded++;
      } catch (err) {
        this.logger.error(
          `Failed to process interview reminder for ${interview.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    if (reminded > 0) {
      this.logger.log(
        `Sent interview reminders for ${reminded} of ${interviews.length} upcoming interview(s)`,
      );
    }
    return { considered: interviews.length, reminded };
  }

  private async remind(
    interview: InterviewSchedule,
    now: Date,
  ): Promise<boolean> {
    // The 24h scan is a superset — this is where timing is decided.
    if (!interview.isReminderDue(now)) return false;

    const application = await this.applicationLookupPort.findById(
      interview.jobApplicationId,
    );
    // An interview whose application has since ended (rejected, withdrawn,
    // hired) is moot — reminding someone about it would be wrong. It is left
    // unclaimed; the status can't go back, so it just stays skipped.
    if (!application || !isApplicationInterviewable(application.status)) {
      return false;
    }

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) return false;

    const [candidate, recruiter] = await Promise.all([
      this.userLookupPort.findById(application.userId),
      this.userLookupPort.findById(job.postedById),
    ]);
    if (!candidate && !recruiter) return false;

    // Claim *before* sending: the claim is atomic, so when two instances
    // overlap (a deploy) only one gets to send. The price is at-most-once —
    // a mail failure below is logged, not retried, which matches how the
    // booking emails treat mail failures (a notification problem, not a
    // reason to try again and risk emailing twice).
    const claimed = await this.interviewRepository.claimReminder(
      interview.id,
      interview.scheduledAt,
      now,
    );
    if (!claimed) return false;

    const base = {
      jobTitle: job.title,
      scheduledAt: interview.scheduledAt,
      location: interview.location,
      meetingLink: interview.meetingLink,
      note: interview.note,
      now,
      candidateName: candidate?.fullName ?? null,
    };

    const recipients = [
      candidate && { user: candidate, audience: 'candidate' as const },
      recruiter && { user: recruiter, audience: 'recruiter' as const },
    ].filter((r): r is NonNullable<typeof r> => !!r);

    // Independent sends: the recruiter's failing must not cost the candidate
    // their reminder (or the other way round).
    for (const { user, audience } of recipients) {
      try {
        const { subject, html } = buildInterviewReminderEmail({
          ...base,
          audience,
        });
        await this.mailPort.sendEmail({ to: user.email, subject, html });
      } catch (err) {
        this.logger.error(
          `Failed to send interview reminder to ${audience} ${user.email} for interview ${interview.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    return true;
  }
}
