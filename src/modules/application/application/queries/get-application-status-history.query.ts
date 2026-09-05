import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationStatusHistoryRepository } from '@/modules/application/domain/repositories/application-status-history.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import {
  JobApplicationNotFoundException,
  ReferencedJobNotFoundException,
  ApplicationHistoryViewNotAllowedException,
} from '@/modules/application/domain/exceptions/application.exceptions';

export interface ApplicationStatusHistoryItemDto {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedById: string | null;
  createdAt: Date;
}

export class GetApplicationStatusHistoryQuery {
  constructor(
    public readonly requesterId: string,
    public readonly applicationId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetApplicationStatusHistoryQuery)
export class GetApplicationStatusHistoryHandler implements IQueryHandler<
  GetApplicationStatusHistoryQuery,
  ApplicationStatusHistoryItemDto[]
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly historyRepository: IApplicationStatusHistoryRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    requesterId,
    applicationId,
  }: GetApplicationStatusHistoryQuery): Promise<
    ApplicationStatusHistoryItemDto[]
  > {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) throw new JobApplicationNotFoundException(applicationId);

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new ReferencedJobNotFoundException(application.jobId);

    const isCandidate = application.userId === requesterId;
    const isRecruiterOwner = job.postedById === requesterId;
    if (!isCandidate && !isRecruiterOwner) {
      throw new ApplicationHistoryViewNotAllowedException();
    }

    const history =
      await this.historyRepository.findByApplicationId(applicationId);
    return history.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      note: entry.note,
      changedById: entry.changedById,
      createdAt: entry.createdAt,
    }));
  }
}
