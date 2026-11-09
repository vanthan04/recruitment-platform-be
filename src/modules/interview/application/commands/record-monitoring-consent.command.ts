import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import {
  InterviewMonitoringNotAllowedException,
  InterviewNotFoundException,
  InterviewRoomNotEnabledException,
  InterviewSessionNotOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';
import { resolveInterviewParticipant } from '@/modules/interview/application/utils/interview-participant.util';

export interface MonitoringConsentResult {
  sessionId: string;
  consentedAt: Date;
  noticeVersion: string;
}

export class RecordMonitoringConsentCommand extends Command<MonitoringConsentResult> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
    public readonly noticeVersion: string,
  ) {
    super();
  }
}

/**
 * The candidate opts in to AI analysis of their own webcam for the current
 * session. Only the candidate — never the recruiter — can do this, only for an
 * interview held in the platform room, and only while a session is open. The
 * consent (time + notice version) is persisted on the session before any frame
 * is analysed; the first consent in a session is kept.
 */
@Injectable()
@CommandHandler(RecordMonitoringConsentCommand)
export class RecordMonitoringConsentHandler implements ICommandHandler<
  RecordMonitoringConsentCommand,
  MonitoringConsentResult
> {
  constructor(
    private readonly readRepository: IInterviewReadRepository,
    private readonly sessionRepository: IInterviewSessionRepository,
  ) {}

  async execute({
    requesterId,
    interviewId,
    noticeVersion,
  }: RecordMonitoringConsentCommand): Promise<MonitoringConsentResult> {
    const item = await this.readRepository.findItemById(interviewId);
    if (!item) throw new InterviewNotFoundException(interviewId);

    const role = resolveInterviewParticipant(item, requesterId);
    if (role !== 'CANDIDATE')
      throw new InterviewMonitoringNotAllowedException();
    if (!item.interview.useRoom) throw new InterviewRoomNotEnabledException();

    const session =
      await this.sessionRepository.findOpenByInterviewId(interviewId);
    if (!session) throw new InterviewSessionNotOpenException();

    if (!session.monitoringConsentAt) {
      session.recordMonitoringConsent(noticeVersion);
      await this.sessionRepository.update(session);
    }

    return {
      sessionId: session.id,
      consentedAt: session.monitoringConsentAt!,
      noticeVersion: session.monitoringNoticeVersion!,
    };
  }
}
