import { Injectable } from '@nestjs/common';
import {
  CandidateSkillProfile,
  IJobRecommendationRepository,
  RecommendableJobRecord,
} from '@/modules/ai/domain/repositories/job-recommendation.repository';
import { normalizeSkills } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { JobRecommendationPrismaRepository } from '@/modules/ai/infrastructure/persistence/prisma/job-recommendation-prisma.repository';

@Injectable()
export class JobRecommendationInfraRepository implements IJobRecommendationRepository {
  constructor(
    private readonly recommendationPrisma: JobRecommendationPrismaRepository,
  ) {}

  async findCandidateSkillProfile(
    userId: string,
  ): Promise<CandidateSkillProfile> {
    const analyses =
      await this.recommendationPrisma.findAnalyzedCvSkills(userId);
    return {
      hasAnalyzedCv: analyses.length > 0,
      skills: normalizeSkills(analyses.flatMap((a) => a.skills)),
    };
  }

  async findOpenJobsNotAppliedBy(
    userId: string,
    limit: number,
  ): Promise<RecommendableJobRecord[]> {
    const jobs = await this.recommendationPrisma.findOpenJobsNotAppliedBy(
      userId,
      limit,
    );
    return jobs.map(({ skills, ...job }) => ({
      ...job,
      skillNames: skills.map((s) => s.skill.name),
    }));
  }

  async findSkillDisplayNames(
    normalizedSkills: string[],
  ): Promise<Map<string, string>> {
    const skills =
      await this.recommendationPrisma.findSkillsByNameInsensitive(
        normalizedSkills,
      );
    const names = new Map<string, string>();
    for (const { name } of skills) {
      const key = name.trim().toLowerCase();
      if (!names.has(key)) names.set(key, name.trim());
    }
    return names;
  }
}
