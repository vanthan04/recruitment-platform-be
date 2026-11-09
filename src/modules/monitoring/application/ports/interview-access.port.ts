export type InterviewParticipantRole = 'CANDIDATE' | 'RECRUITER';

export interface MonitoringSessionInfo {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  monitoringConsentAt: Date | null;
  monitoringNoticeVersion: string | null;
}

/**
 * What the monitoring module needs from the interview module. Implemented by
 * an adapter over the interview module's own repositories — participants are
 * resolved from DB relations (application.userId / job.postedById).
 */
export abstract class IMonitoringInterviewAccessPort {
  /** null = no such interview; role null = exists, but the user isn't a participant. */
  abstract resolveRole(
    interviewId: string,
    userId: string,
  ): Promise<{ role: InterviewParticipantRole | null } | null>;
  /** Newest first. */
  abstract listSessions(interviewId: string): Promise<MonitoringSessionInfo[]>;
}
