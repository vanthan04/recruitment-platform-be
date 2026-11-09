import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import {
  InterviewNotFoundException,
  InterviewNotActionableException,
  InterviewSessionAlreadyOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewSessionResponseDto } from '@/modules/interview/application/dto/interview-detail-response.dto';
import { InterviewDetailResponseMapper } from '@/modules/interview/application/mappers/interview-detail-response.mapper';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';
import { ensureApplicationInterviewable } from '@/modules/interview/application/utils/ensure-application-interviewable.util';

export class StartInterviewSessionCommand extends Command<InterviewSessionResponseDto> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
  ) {
    super();
  }
}

/**
 * Starts a session for an interview. Allowed for the candidate and the
 * job-owning recruiter, only while the interview is still pending
 * (SCHEDULED/RESCHEDULED), its application is not in a final status, and no
 * other session is already open.
 */
@Injectable()
@CommandHandler(StartInterviewSessionCommand)
export class StartInterviewSessionHandler implements ICommandHandler<
  StartInterviewSessionCommand,
  InterviewSessionResponseDto
> {
  constructor(
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async execute({
    requesterId,
    interviewId,
  }: StartInterviewSessionCommand): Promise<InterviewSessionResponseDto> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);

    resolveInterviewParticipant(item, requesterId);
    ensureApplicationInterviewable(item.applicationStatus);
    if (!item.interview.isActive()) {
      throw new InterviewNotActionableException('started');
    }

    const open =
      await this.sessionRepository.findOpenByInterviewId(interviewId);
    if (open) throw new InterviewSessionAlreadyOpenException();

    // A concurrent start that slips past the check above is rejected by the
    // DB's partial unique index and surfaces from save() as the same
    // InterviewSessionAlreadyOpenException.
    const saved = await this.sessionRepository.save(
      new InterviewSession({ interviewId, startedById: requesterId }),
    );
    return InterviewDetailResponseMapper.sessionToDto(saved);
  }
}
