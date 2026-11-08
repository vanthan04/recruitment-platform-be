/**
 * Reads behind job recommendations: what the candidate knows (from their
 * analyzed CVs) and which jobs they could still apply to.
 */

/**
 * How many of the newest open jobs are scored per request. Matching happens
 * in memory (see rankJobsBySkillMatch), so this bounds the work; on a larger
 * catalogue the very oldest open jobs would simply not be considered.
 */
export const RECOMMENDATION_CANDIDATE_POOL = 300;

export interface CandidateSkillProfile {
  /** Whether at least one of the candidate's published CVs has finished AI analysis. */
  hasAnalyzedCv: boolean;
  /** Union of the skills across those CVs — normalized (trimmed, lowercased), de-duplicated. */
  skills: string[];
}

export interface RecommendableJobRecord {
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
  /** The job's required skills, as named in the skill catalogue (e.g. "NestJS"). */
  skillNames: string[];
}

export abstract class IJobRecommendationRepository {
  abstract findCandidateSkillProfile(
    userId: string,
  ): Promise<CandidateSkillProfile>;

  /**
   * Open, not expired, not deleted jobs that list at least one skill and that
   * this candidate has never applied to (including withdrawn applications —
   * the platform allows one application per job, ever), newest first.
   */
  abstract findOpenJobsNotAppliedBy(
    userId: string,
    limit: number,
  ): Promise<RecommendableJobRecord[]>;
}
