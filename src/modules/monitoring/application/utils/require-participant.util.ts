import {
  IMonitoringInterviewAccessPort,
  InterviewParticipantRole,
} from '@/modules/monitoring/application/ports/interview-access.port';
import {
  MonitoringAccessNotAllowedException,
  MonitoringInterviewNotFoundException,
} from '@/modules/monitoring/domain/exceptions/monitoring.exceptions';

/** The requester's role in the interview, or throws (404 unknown interview, 403 not a participant). */
export async function requireParticipant(
  access: IMonitoringInterviewAccessPort,
  interviewId: string,
  userId: string,
): Promise<InterviewParticipantRole> {
  const result = await access.resolveRole(interviewId, userId);
  if (!result) throw new MonitoringInterviewNotFoundException(interviewId);
  if (!result.role) throw new MonitoringAccessNotAllowedException();
  return result.role;
}
