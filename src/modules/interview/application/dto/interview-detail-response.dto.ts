import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';

export type InterviewViewerRole = 'CANDIDATE' | 'RECRUITER';

/** An interview plus the context a list/detail screen needs. */
export class InterviewDetailResponseDto extends InterviewResponseDto {
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string | null;
  /** The requester's role in this interview. */
  viewerRole: InterviewViewerRole;
}

export class InterviewSessionResponseDto {
  id: string;
  interviewId: string;
  startedAt: Date;
  endedAt: Date | null;
  startedById: string | null;
  /** When the candidate opted in to AI monitoring in this session; null = not monitored. */
  monitoringConsentAt: Date | null;
  /** IN_PROGRESS while endedAt is null, otherwise ENDED. */
  status: 'IN_PROGRESS' | 'ENDED';
}
