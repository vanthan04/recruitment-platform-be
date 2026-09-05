import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import {
  InterviewApplicationNotFoundException,
  InterviewJobNotFoundException,
  InterviewTimeInPastException,
  InterviewAlreadyScheduledException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { buildInterviewEmail } from '@/modules/interview/application/utils/interview-mail.util';
import { ensureApplicationInterviewable } from '@/modules/interview/application/utils/ensure-application-interviewable.util';

export interface ScheduleInterviewInput {
  jobApplicationId: string;
  scheduledAt: string;
  location?: string;
  meetingLink?: string;
  note?: string;
  durationMinutes?: number;
}

export class ScheduleInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly input: ScheduleInterviewInput,
  ) {}
}

@Injectable()
@CommandHandler(ScheduleInterviewCommand)
export class ScheduleInterviewHandler implements ICommandHandler<
  ScheduleInterviewCommand,
  InterviewResponseDto
> {
  private readonly logger = new Logger(ScheduleInterviewHandler.name);

  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
    private readonly userLookupPort: IInterviewUserLookupPort,
    private readonly mailPort: IInterviewMailPort,
  ) {}

  async execute({
    recruiterId,
    input,
  }: ScheduleInterviewCommand): Promise<InterviewResponseDto> {
    const application = await this.applicationLookupPort.findById(
      input.jobApplicationId,
    );
    if (!application)
      throw new InterviewApplicationNotFoundException(input.jobApplicationId);
    ensureApplicationInterviewable(application.status);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new InterviewJobNotFoundException(application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can schedule interviews for this application',
      'INTERVIEW_SCHEDULE_ACCESS_DENIED',
    );

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new InterviewTimeInPastException();
    }

    // Retrying a request that actually succeeded (e.g. after the mail send
    // below threw) must not silently create a second, conflicting interview
    // for the same application.
    const existing = await this.interviewRepository.findByApplicationId(
      input.jobApplicationId,
    );
    if (existing.some((i) => i.isActive())) {
      throw new InterviewAlreadyScheduledException();
    }

    const interview = new InterviewSchedule({
      jobApplicationId: input.jobApplicationId,
      scheduledAt,
      location: input.location ?? null,
      meetingLink: input.meetingLink ?? null,
      note: input.note ?? null,
      durationMinutes: input.durationMinutes ?? null,
      createdById: recruiterId,
    });

    const saved = await this.interviewRepository.save(interview);

    const candidate = await this.userLookupPort.findById(application.userId);
    if (candidate) {
      // The interview is already committed at this point — a mail failure
      // is a notification problem, not a reason to report this request as
      // failed (which would also invite a retry that trips the
      // already-scheduled guard above).
      try {
        const { subject, html } = buildInterviewEmail('scheduled', {
          jobTitle: job.title,
          scheduledAt: saved.scheduledAt,
          location: saved.location,
          meetingLink: saved.meetingLink,
          note: saved.note,
        });
        await this.mailPort.sendEmail({ to: candidate.email, subject, html });
      } catch (err) {
        this.logger.error(
          `Failed to email candidate ${candidate.email} about interview ${saved.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    return InterviewResponseMapper.toDto(saved);
  }
}
