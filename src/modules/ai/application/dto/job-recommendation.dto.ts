export class RecommendedJobSummaryDto {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  workMode: string;
  level: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  expiresAt: Date | null;
  createdAt: Date;
  company: { id: string; name: string; logoUrl: string | null };
}

export class RecommendedJobDto {
  job: RecommendedJobSummaryDto;
  /** The job's skills the candidate has, in the job's own spelling. */
  matchedSkills: string[];
  /** The job's skills the candidate doesn't have, in the job's own spelling. */
  missingSkills: string[];
  /** Share of the job's skills the candidate covers, 0..1 (two decimals). */
  matchScore: number;
}

export class JobRecommendationsDto {
  /**
   * False when none of the candidate's published CVs has finished AI analysis
   * yet — the client should explain that recommendations need one, rather
   * than showing an empty list as "nothing matches".
   */
  hasAnalyzedCv: boolean;
  /**
   * The skills recommendations were based on, in the skill catalogue's
   * spelling ("MySQL"); a skill the catalogue doesn't know keeps the CV
   * analysis' normalized form.
   */
  candidateSkills: string[];
  items: RecommendedJobDto[];
}
