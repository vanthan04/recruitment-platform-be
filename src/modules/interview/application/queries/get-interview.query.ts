import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { InterviewNotFoundException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewDetailResponseDto } from '@/modules/interview/application/dto/interview-detail-response.dto';
import { InterviewDetailResponseMapper } from '@/modules/interview/application/mappers/interview-detail-response.mapper';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export class GetInterviewQuery extends Query<InterviewDetailResponseDto> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(GetInterviewQuery)
export class GetInterviewHandler implements IQueryHandler<
  GetInterviewQuery,
  InterviewDetailResponseDto
> {
  constructor(private readonly readRepository: IInterviewReadRepository) {}

  async execute({
    requesterId,
    interviewId,
  }: GetInterviewQuery): Promise<InterviewDetailResponseDto> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);

    const viewerRole = resolveInterviewParticipant(item, requesterId);
    return InterviewDetailResponseMapper.toDto(item, viewerRole);
  }
}
