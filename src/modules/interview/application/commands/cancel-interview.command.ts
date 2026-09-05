import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import {
  InterviewNotFoundException,
  InterviewApplicationNotFoundException,
  InterviewJobNotFoundException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { buildInterviewEmail } from '@/modules/interview/application/utils/interview-mail.util';
import { ensureApplicationInterviewable } from '@/modules/interview/application/utils/ensure-application-interviewable.util';

export class CancelInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly interviewId: string,
  ) {}
}

@Injectable()
@CommandHandler(CancelInterviewCommand)
export class CancelInterviewHandler implements ICommandHandler<
  CancelInterviewCommand,
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
  }: CancelInterviewCommand): Promise<InterviewResponseDto> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) throw new InterviewNotFoundException(interviewId);

    const application = await this.applicationLookupPort.findById(
      interview.jobApplicationId,
    );
    if (!application)
      throw new InterviewApplicationNotFoundException(
        interview.jobApplicationId,
      );
    ensureApplicationInterviewable(application.status);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new InterviewJobNotFoundException(application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can cancel this interview',
      'INTERVIEW_CANCEL_ACCESS_DENIED',
    );

    interview.cancel();
    const saved = await this.interviewRepository.update(interview);

    const candidate = await this.userLookupPort.findById(application.userId);
    if (candidate) {
      const { subject, html } = buildInterviewEmail('cancelled', {
        jobTitle: job.title,
        scheduledAt: saved.scheduledAt,
      });
      await this.mailPort.sendEmail({ to: candidate.email, subject, html });
    }

    return InterviewResponseMapper.toDto(saved);
  }
}
