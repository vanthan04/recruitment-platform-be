import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export interface ListMyJobsInput {
  page: number;
  limit: number;
  status?: string;
}

export class ListMyJobsQuery {
  constructor(
    public readonly recruiterId: string,
    public readonly input: ListMyJobsInput,
  ) {}
}

export interface ListMyJobsResult {
  jobs: JobResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(ListMyJobsQuery)
export class ListMyJobsHandler implements IQueryHandler<
  ListMyJobsQuery,
  ListMyJobsResult
> {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute({
    recruiterId,
    input,
  }: ListMyJobsQuery): Promise<ListMyJobsResult> {
    const { jobs, total } =
      await this.jobRepository.findAllByRecruiterPaginated({
        recruiterId,
        page: input.page,
        limit: input.limit,
        status: input.status,
      });

    return {
      jobs: JobResponseMapper.toDtoList(jobs),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
