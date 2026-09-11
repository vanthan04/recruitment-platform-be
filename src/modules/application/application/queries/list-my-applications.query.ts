import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { normalizePagination } from '@/common/utils/pagination.util';

export interface ListMyApplicationsResult {
  applications: ApplicationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ListMyApplicationsQuery extends Query<ListMyApplicationsResult> {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(ListMyApplicationsQuery)
export class ListMyApplicationsHandler implements IQueryHandler<
  ListMyApplicationsQuery,
  ListMyApplicationsResult
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  async execute({
    userId,
    page,
    limit,
  }: ListMyApplicationsQuery): Promise<ListMyApplicationsResult> {
    const normalized = normalizePagination({ page, limit });
    const { applications: apps, total } =
      await this.applicationRepository.findAllByUserId(userId, {
        skip: normalized.skip,
        take: normalized.limit,
      });

    return {
      applications: ApplicationResponseMapper.toDtoList(apps),
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
