export interface ApplicationCandidateSummaryDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export class ApplicationResponseDto {
  id: string;
  status: string;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  cvId: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional relations for richness
  job?: any;
  cv?: any;
  /** Populated by ListApplicationsByJobHandler (recruiter view) — not set on candidate-scoped queries. */
  candidate?: ApplicationCandidateSummaryDto;
}
