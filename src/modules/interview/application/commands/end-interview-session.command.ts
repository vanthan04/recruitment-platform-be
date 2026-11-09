import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import {
  InterviewNotFoundException,
  InterviewSessionNotFoundException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewSessionResponseDto } from '@/modules/interview/application/dto/interview-detail-response.dto';
import { InterviewDetailResponseMapper } from '@/modules/interview/application/mappers/interview-detail-response.mapper';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export class EndInterviewSessionCommand extends Command<InterviewSessionResponseDto> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
    public readonly sessionId: string,
  ) {
    super();
  }
}

/**
 * Ends a session. Either participant may end it (the recruiter can close one
 * the candidate left open). Deliberately allowed even when the interview or
 * application has since reached a final status, so a stale session can always
 * be closed.
 */
@Injectable()
@CommandHandler(EndInterviewSessionCommand)
export class EndInterviewSessionHandler implements ICommandHandler<
  EndInterviewSessionCommand,
  InterviewSessionResponseDto
> {
  constructor(
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async execute({
    requesterId,
    interviewId,
    sessionId,
  }: EndInterviewSessionCommand): Promise<InterviewSessionResponseDto> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);
    resolveInterviewParticipant(item, requesterId);

    const session = await this.sessionRepository.findById(sessionId);
    // A session id from a different interview is "not found", not "forbidden":
    // it must not reveal that the id exists.
    if (!session || session.interviewId !== interviewId) {
      throw new InterviewSessionNotFoundException(sessionId);
    }

    session.end();
    const saved = await this.sessionRepository.update(session);
    return InterviewDetailResponseMapper.sessionToDto(saved);
  }
}
