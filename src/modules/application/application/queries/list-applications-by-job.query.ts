import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

export class ListApplicationsByJobQuery {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@QueryHandler(ListApplicationsByJobQuery)
export class ListApplicationsByJobHandler
  implements IQueryHandler<ListApplicationsByJobQuery, ApplicationResponseDto[]>
{
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    jobId,
  }: ListApplicationsByJobQuery): Promise<ApplicationResponseDto[]> {
    const job = await this.jobLookupPort.findById(jobId);
    if (!job) throw new EntityNotFoundException('Job', jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can view applications');
    }

    const apps = await this.applicationRepository.findAllByJobId(jobId);
    return ApplicationResponseMapper.toDtoList(apps);
  }
}
