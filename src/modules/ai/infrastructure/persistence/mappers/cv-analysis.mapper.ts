import { CvAnalysis } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { CvAnalysisStatus } from '@/modules/ai/domain/value-objects/cv-analysis-status.vo';
import { CvAnalysis as PrismaCvAnalysis, Prisma } from '@prisma/client';

/**
 * Maps Prisma raw data to domain entities and vice versa.
 * Lives in the infrastructure layer — knows about both Prisma shape and domain.
 */
export class CvAnalysisMapper {
  static toDomain(raw: PrismaCvAnalysis | null): CvAnalysis | null {
    if (!raw) return null;

    return new CvAnalysis({
      id: raw.id,
      cvId: raw.cvId,
      status: raw.status as CvAnalysisStatus,
      summary: raw.summary,
      skills: raw.skills,
      experienceYears: raw.experienceYears,
      education: raw.education,
      extractedText: raw.extractedText,
      model: raw.model,
      analyzedAt: raw.analyzedAt,
      failureReason: raw.failureReason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(
    analysis: CvAnalysis,
  ): Prisma.CvAnalysisUncheckedCreateInput {
    return {
      id: analysis.id,
      cvId: analysis.cvId,
      status: analysis.status,
      summary: analysis.summary,
      skills: analysis.skills,
      experienceYears: analysis.experienceYears,
      education: analysis.education,
      extractedText: analysis.extractedText,
      model: analysis.model,
      analyzedAt: analysis.analyzedAt,
      failureReason: analysis.failureReason,
    };
  }
}
