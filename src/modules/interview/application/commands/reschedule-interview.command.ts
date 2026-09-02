import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { ensureOwner } from '@/common/utils/ownership.util';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { buildInterviewEmail } from '@/modules/interview/application/utils/interview-mail.util';

export interface RescheduleInterviewInput {
  scheduledAt?: string;
  location?: string;
  meetingLink?: string;
  note?: string;
}

export class RescheduleInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly interviewId: string,
    public readonly input: RescheduleInterviewInput,
  ) {}
}

@Injectable()
@CommandHandler(RescheduleInterviewCommand)
export class RescheduleInterviewHandler implements ICommandHandler<
  RescheduleInterviewCommand,
  InterviewResponseDto
> {
  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
    private readonly userLookupPort: IInterviewUserLookupPort,
    private readonly mailPort: IInterviewMailPort,
  ) {}

  async execute({
    recruiterId,
    interviewId,
    input,
  }: RescheduleInterviewCommand): Promise<InterviewResponseDto> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview)
      throw new EntityNotFoundException('InterviewSchedule', interviewId);

    const application = await this.applicationLookupPort.findById(
      interview.jobApplicationId,
    );
    if (!application)
      throw new EntityNotFoundException(
        'Application',
        interview.jobApplicationId,
      );

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can reschedule this interview',
    );

    interview.reschedule(
      input.scheduledAt ? new Date(input.scheduledAt) : interview.scheduledAt,
      input.location,
      input.meetingLink,
      input.note,
    );

    const saved = await this.interviewRepository.update(interview);

    const candidate = await this.userLookupPort.findById(application.userId);
    if (candidate) {
      const { subject, html } = buildInterviewEmail('rescheduled', {
        jobTitle: job.title,
        scheduledAt: saved.scheduledAt,
        location: saved.location,
        meetingLink: saved.meetingLink,
        note: saved.note,
      });
      await this.mailPort.sendEmail({ to: candidate.email, subject, html });
    }

    return InterviewResponseMapper.toDto(saved);
  }
}
