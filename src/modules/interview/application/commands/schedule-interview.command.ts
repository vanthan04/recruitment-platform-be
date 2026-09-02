import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';
import { buildInterviewEmail } from '@/modules/interview/application/utils/interview-mail.util';

export interface ScheduleInterviewInput {
  jobApplicationId: string;
  scheduledAt: string;
  location?: string;
  meetingLink?: string;
  note?: string;
}

export class ScheduleInterviewCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly input: ScheduleInterviewInput,
  ) {}
}

@Injectable()
@CommandHandler(ScheduleInterviewCommand)
export class ScheduleInterviewHandler
  implements ICommandHandler<ScheduleInterviewCommand, InterviewResponseDto>
{
  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
    private readonly userLookupPort: IInterviewUserLookupPort,
    private readonly mailService: IMailService,
  ) {}

  async execute({ recruiterId, input }: ScheduleInterviewCommand): Promise<InterviewResponseDto> {
    const application = await this.applicationLookupPort.findById(input.jobApplicationId);
    if (!application) throw new EntityNotFoundException('Application', input.jobApplicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can schedule interviews for this application');
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BusinessRuleViolationException('Interview time must be in the future');
    }

    const interview = new InterviewSchedule({
      jobApplicationId: input.jobApplicationId,
      scheduledAt,
      location: input.location ?? null,
      meetingLink: input.meetingLink ?? null,
      note: input.note ?? null,
      createdById: recruiterId,
    });

    const saved = await this.interviewRepository.save(interview);

    const candidate = await this.userLookupPort.findById(application.userId);
    if (candidate) {
      const { subject, html } = buildInterviewEmail('scheduled', {
        jobTitle: job.title,
        scheduledAt: saved.scheduledAt,
        location: saved.location,
        meetingLink: saved.meetingLink,
        note: saved.note,
      });
      await this.mailService.sendEmail({ to: candidate.email, subject, html });
    }

    return InterviewResponseMapper.toDto(saved);
  }
}
