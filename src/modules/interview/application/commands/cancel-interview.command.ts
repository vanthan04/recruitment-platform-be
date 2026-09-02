import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { buildInterviewEmail } from '@/modules/interview/application/utils/interview-mail.util';

export class CancelInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly interviewId: string,
  ) {}
}

@Injectable()
@CommandHandler(CancelInterviewCommand)
export class CancelInterviewHandler implements ICommandHandler<CancelInterviewCommand, InterviewResponseDto> {
  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
    private readonly userLookupPort: IInterviewUserLookupPort,
    private readonly mailService: IMailService,
  ) {}

  async execute({ recruiterId, interviewId }: CancelInterviewCommand): Promise<InterviewResponseDto> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) throw new EntityNotFoundException('InterviewSchedule', interviewId);

    const application = await this.applicationLookupPort.findById(interview.jobApplicationId);
    if (!application) throw new EntityNotFoundException('Application', interview.jobApplicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can cancel this interview');
    }

    interview.cancel();
    const saved = await this.interviewRepository.update(interview);

    const candidate = await this.userLookupPort.findById(application.userId);
    if (candidate) {
      const { subject, html } = buildInterviewEmail('cancelled', {
        jobTitle: job.title,
        scheduledAt: saved.scheduledAt,
      });
      await this.mailService.sendEmail({ to: candidate.email, subject, html });
    }

    return InterviewResponseMapper.toDto(saved);
  }
}
