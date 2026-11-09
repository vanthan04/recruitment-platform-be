import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import { InterviewDetailResponseDto } from '@/modules/interview/application/dto/interview-detail-response.dto';
import { InterviewDetailResponseMapper } from '@/modules/interview/application/mappers/interview-detail-response.mapper';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export class ListMyInterviewsQuery extends Query<ListMyInterviewsResult> {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly status?: InterviewStatus,
    public readonly upcoming?: boolean,
  ) {
    super();
  }
}

export interface ListMyInterviewsResult {
  interviews: InterviewDetailResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(ListMyInterviewsQuery)
export class ListMyInterviewsHandler implements IQueryHandler<
  ListMyInterviewsQuery,
  ListMyInterviewsResult
> {
  constructor(private readonly readRepository: IInterviewReadRepository) {}

  async execute({
    userId,
    page,
    limit,
    status,
    upcoming,
  }: ListMyInterviewsQuery): Promise<ListMyInterviewsResult> {
    const { items, total } = await this.readRepository.findForParticipant({
      userId,
      status,
      upcoming,
      page,
      limit,
    });

    return {
      interviews: items.map((item) =>
        InterviewDetailResponseMapper.toDto(
          item,
          resolveInterviewParticipant(item, userId),
        ),
      ),
      total,
      page,
      limit,
    };
  }
}
