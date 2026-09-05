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

export class CompleteInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly interviewId: string,
  ) {}
}

@Injectable()
@CommandHandler(CompleteInterviewCommand)
export class CompleteInterviewHandler implements ICommandHandler<
  CompleteInterviewCommand,
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
  }: CompleteInterviewCommand): Promise<InterviewResponseDto> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) throw new InterviewNotFoundException(interviewId);

    const application = await this.applicationLookupPort.findById(
      interview.jobApplicationId,
    );
    if (!application)
      throw new InterviewApplicationNotFoundException(
        interview.jobApplicationId,
      );

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new InterviewJobNotFoundException(application.jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can complete this interview',
      'INTERVIEW_COMPLETE_ACCESS_DENIED',
    );

    interview.complete();
    const saved = await this.interviewRepository.update(interview);

    return InterviewResponseMapper.toDto(saved);
  }
}
