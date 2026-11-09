import { InterviewListItem } from '@/modules/interview/domain/repositories/interview-read.repository';
import { InterviewAccessNotAllowedException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewViewerRole } from '@/modules/interview/application/dto/interview-detail-response.dto';

/**
 * The requester's role in this interview, or throws. Candidate and
 * job-owning recruiter are derived from the DB relations carried by the item
 * (application.userId / job.postedById) — never from client input.
 */
export function resolveInterviewParticipant(
  item: InterviewListItem,
  userId: string,
): InterviewViewerRole {
  if (item.candidateId === userId) return 'CANDIDATE';
  if (item.recruiterId === userId) return 'RECRUITER';
  throw new InterviewAccessNotAllowedException();
}
