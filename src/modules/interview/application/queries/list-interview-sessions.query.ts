import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewNotFoundException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewSessionResponseDto } from '@/modules/interview/application/dto/interview-detail-response.dto';
import { InterviewDetailResponseMapper } from '@/modules/interview/application/mappers/interview-detail-response.mapper';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export class ListInterviewSessionsQuery extends Query<
  InterviewSessionResponseDto[]
> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(ListInterviewSessionsQuery)
export class ListInterviewSessionsHandler implements IQueryHandler<
  ListInterviewSessionsQuery,
  InterviewSessionResponseDto[]
> {
  constructor(
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async execute({
    requesterId,
    interviewId,
  }: ListInterviewSessionsQuery): Promise<InterviewSessionResponseDto[]> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);
    resolveInterviewParticipant(item, requesterId);

    const sessions =
      await this.sessionRepository.findByInterviewId(interviewId);
    return sessions.map((s) => InterviewDetailResponseMapper.sessionToDto(s));
  }
}
