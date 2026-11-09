import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import {
  InterviewNotFoundException,
  InterviewRoomNotEnabledException,
  InterviewSessionNotOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import {
  IInterviewRoomProvider,
  RoomJoinInfo,
} from '@/modules/interview/application/ports/interview-room-provider.port';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export interface RoomJoinResult {
  /** The open session this room visit belongs to. */
  sessionId: string;
  join: RoomJoinInfo;
}

export class GetRoomJoinInfoQuery extends Query<RoomJoinResult> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
  ) {
    super();
  }
}

/**
 * Credentials for entering an interview's video room. Only the candidate and
 * the job-owning recruiter, only for an interview that uses the room, and only
 * while a session is open (the session is the "room is live" switch).
 */
@Injectable()
@QueryHandler(GetRoomJoinInfoQuery)
export class GetRoomJoinInfoHandler implements IQueryHandler<
  GetRoomJoinInfoQuery,
  RoomJoinResult
> {
  constructor(
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
    private readonly roomProvider: IInterviewRoomProvider,
  ) {}

  async execute({
    requesterId,
    interviewId,
  }: GetRoomJoinInfoQuery): Promise<RoomJoinResult> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);

    const role = resolveInterviewParticipant(item, requesterId);
    if (!item.interview.useRoom) throw new InterviewRoomNotEnabledException();

    const session =
      await this.sessionRepository.findOpenByInterviewId(interviewId);
    if (!session) throw new InterviewSessionNotOpenException();

    const join = await this.roomProvider.issueJoinInfo({
      interviewId,
      userId: requesterId,
      role,
    });
    return { sessionId: session.id, join };
  }
}
