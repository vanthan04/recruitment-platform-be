import { normalizeSkills } from '@/modules/ai/domain/entities/cv-analysis.entity';

/**
 * Deterministic skill matching between a job and a candidate — the basis of
 * job recommendations. No model call: the candidate's skills were already
 * extracted by the AI CV analysis when the CV was uploaded (CvAnalysis.skills,
 * normalized), so ranking is a plain set comparison that is fast, free and
 * reproducible.
 */

export interface SkillMatch {
  /** The job's skills the candidate has, in the job's own spelling. */
  matchedSkills: string[];
  /** The job's skills the candidate doesn't have (yet), in the job's own spelling. */
  missingSkills: string[];
  /** Share of the job's skills the candidate covers, 0..1. */
  score: number;
}

/**
 * Compares a job's required skills (display names, e.g. "NestJS") with the
 * candidate's normalized skills ("nestjs"). Duplicate job skills that only
 * differ in case/whitespace count once.
 */
export function matchJobSkills(
  jobSkillNames: string[],
  candidateSkills: ReadonlySet<string>,
): SkillMatch {
  const seen = new Set<string>();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const name of jobSkillNames) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    (candidateSkills.has(key) ? matchedSkills : missingSkills).push(
      name.trim(),
    );
  }

  const total = matchedSkills.length + missingSkills.length;
  return {
    matchedSkills,
    missingSkills,
    score: total === 0 ? 0 : matchedSkills.length / total,
  };
}

export interface RankableJob {
  skillNames: string[];
  createdAt: Date;
}

/**
 * The value jobs are ordered by: coverage, smoothed so that a job listing very
 * few skills can't win on a technicality. Plain coverage would put "1 of 1"
 * (100%) above "3 of 4" (75%), so a job asking only for, say, JavaScript would
 * top the list for nearly everyone. matched / (total + 1) keeps coverage's
 * meaning but needs evidence: 1/1 → 0.5, 2/2 → 0.67, 3/4 → 0.6, 4/4 → 0.8,
 * 3/10 → 0.27. Used only for ordering — what users see is the plain score.
 */
export function rankValue(match: SkillMatch): number {
  const total = match.matchedSkills.length + match.missingSkills.length;
  return match.matchedSkills.length / (total + 1);
}

/**
 * Keeps the jobs the candidate matches at least one skill of, best first by
 * rankValue (smoothed coverage), then by most skills matched, then newest.
 */
export function rankJobsBySkillMatch<T extends RankableJob>(
  jobs: T[],
  candidateSkills: string[],
  limit: number,
): Array<{ job: T } & SkillMatch> {
  const skillSet = new Set(normalizeSkills(candidateSkills));
  if (skillSet.size === 0 || limit <= 0) return [];

  return jobs
    .map((job) => ({ job, ...matchJobSkills(job.skillNames, skillSet) }))
    .filter((entry) => entry.matchedSkills.length > 0)
    .sort(
      (a, b) =>
        rankValue(b) - rankValue(a) ||
        b.matchedSkills.length - a.matchedSkills.length ||
        b.job.createdAt.getTime() - a.job.createdAt.getTime(),
    )
    .slice(0, limit);
}
