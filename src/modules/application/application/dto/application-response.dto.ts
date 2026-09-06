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
  // Optional relations for richness — never populated by any current
  // handler (no mapper assigns to these), kept as `unknown` rather than a
  // guessed shape until something actually sets them.
  job?: unknown;
  cv?: unknown;
  /** Populated by ListApplicationsByJobHandler (recruiter view) — not set on candidate-scoped queries. */
  candidate?: ApplicationCandidateSummaryDto;
}
