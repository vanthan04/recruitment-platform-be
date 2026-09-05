import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { IApplicationUserLookupPort } from '@/modules/application/application/ports/user-lookup.port';
import { ReferencedJobNotFoundException } from '@/modules/application/domain/exceptions/application.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { normalizePagination } from '@/common/utils/pagination.util';

export interface ListApplicationsByJobResult {
  applications: ApplicationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ListApplicationsByJobQuery {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}

@Injectable()
@QueryHandler(ListApplicationsByJobQuery)
export class ListApplicationsByJobHandler implements IQueryHandler<
  ListApplicationsByJobQuery,
  ListApplicationsByJobResult
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobLookupPort: IJobLookupPort,
    private readonly userLookupPort: IApplicationUserLookupPort,
  ) {}

  async execute({
    recruiterId,
    jobId,
    page,
    limit,
  }: ListApplicationsByJobQuery): Promise<ListApplicationsByJobResult> {
    const job = await this.jobLookupPort.findById(jobId);
    if (!job) throw new ReferencedJobNotFoundException(jobId);

    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can view applications',
      'APPLICATION_LIST_ACCESS_DENIED',
    );

    const normalized = normalizePagination({ page, limit });
    const { applications: apps, total } =
      await this.applicationRepository.findAllByJobId(jobId, {
        skip: normalized.skip,
        take: normalized.limit,
      });
    const dtos = ApplicationResponseMapper.toDtoList(apps);

    // One batched query for every candidate on this page, instead of one
    // query per application — a popular posting can have thousands of
    // applicants (now bounded per-page anyway, but N+1 within a single page
    // of `limit` is still N round trips saved for N-1).
    const candidates = await this.userLookupPort.findManyByIds(
      dtos.map((dto) => dto.userId),
    );
    for (const dto of dtos) {
      const candidate = candidates.get(dto.userId);
      if (candidate) dto.candidate = candidate;
    }

    return {
      applications: dtos,
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
