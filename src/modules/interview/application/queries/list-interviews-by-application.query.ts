import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';

export class ListInterviewsByApplicationQuery {
  constructor(
    public readonly requesterId: string,
    public readonly jobApplicationId: string,
  ) {}
}

@Injectable()
@QueryHandler(ListInterviewsByApplicationQuery)
export class ListInterviewsByApplicationHandler
  implements IQueryHandler<ListInterviewsByApplicationQuery, InterviewResponseDto[]>
{
  constructor(
    private readonly interviewRepository: IInterviewScheduleRepository,
    private readonly applicationLookupPort: IInterviewApplicationLookupPort,
    private readonly jobLookupPort: IInterviewJobLookupPort,
  ) {}

  async execute({
    requesterId,
    jobApplicationId,
  }: ListInterviewsByApplicationQuery): Promise<InterviewResponseDto[]> {
    const application = await this.applicationLookupPort.findById(jobApplicationId);
    if (!application) throw new EntityNotFoundException('Application', jobApplicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    const isCandidate = application.userId === requesterId;
    const isRecruiterOwner = job.postedById === requesterId;
    if (!isCandidate && !isRecruiterOwner) {
      throw new UnauthorizedDomainException('You are not allowed to view interviews for this application');
    }

    const interviews = await this.interviewRepository.findByApplicationId(jobApplicationId);
    return InterviewResponseMapper.toDtoList(interviews);
  }
}
