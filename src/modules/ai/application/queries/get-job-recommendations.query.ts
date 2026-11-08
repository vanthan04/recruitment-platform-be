import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import {
  IJobRecommendationRepository,
  RECOMMENDATION_CANDIDATE_POOL,
  RecommendableJobRecord,
} from '@/modules/ai/domain/repositories/job-recommendation.repository';
import { rankJobsBySkillMatch } from '@/modules/ai/domain/services/skill-match';
import {
  JobRecommendationsDto,
  RecommendedJobSummaryDto,
} from '@/modules/ai/application/dto/job-recommendation.dto';

export const MAX_RECOMMENDATIONS = 20;

/** Exactly the fields a recommendation card needs — nothing else of the job leaves here. */
function toSummary(job: RecommendableJobRecord): RecommendedJobSummaryDto {
  return {
    id: job.id,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    workMode: job.workMode,
    level: job.level,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    expiresAt: job.expiresAt,
    createdAt: job.createdAt,
    company: job.company,
  };
}

export class GetJobRecommendationsQuery extends Query<JobRecommendationsDto> {
  constructor(
    public readonly userId: string,
    public readonly limit: number = 10,
  ) {
    super();
  }
}

/**
 * Jobs a candidate is likely a fit for, from the skills the AI extracted from
 * their CVs. No model call happens here — see skill-match.ts.
 */
@Injectable()
@QueryHandler(GetJobRecommendationsQuery)
export class GetJobRecommendationsHandler implements IQueryHandler<
  GetJobRecommendationsQuery,
  JobRecommendationsDto
> {
  constructor(
    private readonly recommendationRepository: IJobRecommendationRepository,
  ) {}

  async execute({
    userId,
    limit,
  }: GetJobRecommendationsQuery): Promise<JobRecommendationsDto> {
    const profile =
      await this.recommendationRepository.findCandidateSkillProfile(userId);

    // Nothing to match on yet: don't even load jobs.
    if (profile.skills.length === 0) {
      return {
        hasAnalyzedCv: profile.hasAnalyzedCv,
        candidateSkills: [],
        items: [],
      };
    }

    const jobs = await this.recommendationRepository.findOpenJobsNotAppliedBy(
      userId,
      RECOMMENDATION_CANDIDATE_POOL,
    );
    const ranked = rankJobsBySkillMatch(
      jobs,
      profile.skills,
      Math.min(Math.max(limit, 1), MAX_RECOMMENDATIONS),
    );

    return {
      hasAnalyzedCv: profile.hasAnalyzedCv,
      candidateSkills: profile.skills,
      items: ranked.map(({ job, matchedSkills, missingSkills, score }) => ({
        job: toSummary(job),
        matchedSkills,
        missingSkills,
        matchScore: Math.round(score * 100) / 100,
      })),
    };
  }
}
