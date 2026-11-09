import { Injectable } from '@nestjs/common';
import {
  IMonitoringInterviewAccessPort,
  InterviewParticipantRole,
  MonitoringSessionInfo,
} from '@/modules/monitoring/application/ports/interview-access.port';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';

@Injectable()
export class MonitoringInterviewAccessAdapter implements IMonitoringInterviewAccessPort {
  constructor(
    private readonly interviews: IInterviewReadRepository,
    private readonly sessions: IInterviewSessionRepository,
  ) {}

  async resolveRole(
    interviewId: string,
    userId: string,
  ): Promise<{ role: InterviewParticipantRole | null } | null> {
    const item = await this.interviews.findItemById(interviewId);
    if (!item) return null;
    if (item.candidateId === userId) return { role: 'CANDIDATE' };
    if (item.recruiterId === userId) return { role: 'RECRUITER' };
    return { role: null };
  }

  async listSessions(interviewId: string): Promise<MonitoringSessionInfo[]> {
    const sessions = await this.sessions.findByInterviewId(interviewId);
    return sessions.map((s) => ({
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      monitoringConsentAt: s.monitoringConsentAt,
      monitoringNoticeVersion: s.monitoringNoticeVersion,
    }));
  }
}
