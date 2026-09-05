import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import {
  InterviewNotFoundException,
  InterviewApplicationNotFoundException,
  InterviewJobNotFoundException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { ensureApplicationInterviewable } from '@/modules/interview/application/utils/ensure-application-interviewable.util';

export class MarkInterviewNoShowCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly interviewId: string,
  ) {}
}

@Injectable()
@CommandHandler(MarkInterviewNoShowCommand)
export class MarkInterviewNoShowHandler implements ICommandHandler<
  MarkInterviewNoShowCommand,
  InterviewResponseDto
> {
  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    interviewId,
  }: MarkInterviewNoShowCommand): Promise<InterviewResponseDto> {
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
      'Only the job poster can mark this interview as no-show',
      'INTERVIEW_NO_SHOW_ACCESS_DENIED',
    );

    interview.markNoShow();
    const saved = await this.interviewRepository.update(interview);

    return InterviewResponseMapper.toDto(saved);
  }
}
