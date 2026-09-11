import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ICvAnalysisRepository,
  CandidateSearchFilters,
  CandidateSearchResult,
  CvFileInfo,
} from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysis } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { CvAnalysisPrismaRepository } from '@/modules/ai/infrastructure/persistence/prisma/cv-analysis-prisma.repository';
import { CvAnalysisMapper } from '@/modules/ai/infrastructure/persistence/mappers/cv-analysis.mapper';

type CandidateRow = Prisma.UserGetPayload<{
  include: {
    profile: true;
    cvs: { include: { cvAnalysis: true } };
  };
}>;

/** `candidateRow.cvs[0]` is always the single best-matching CV picked by the repository's own query — see CvAnalysisPrismaRepository. */
function toCandidateSearchResult(
  row: CandidateRow,
): CandidateSearchResult | null {
  const cv = row.cvs[0];
  const analysis = cv?.cvAnalysis;
  if (!cv || !analysis) return null;

  return {
    candidateId: row.id,
    fullName: row.profile?.fullName ?? row.email,
    headline: row.profile?.headline ?? null,
    cvId: cv.id,
    skills: analysis.skills,
    experienceYears: analysis.experienceYears,
    education: analysis.education,
    summary: analysis.summary,
  };
}

/**
 * Infrastructure implementation of ICvAnalysisRepository.
 * Orchestrates Prisma data access and domain mapping.
 */
@Injectable()
export class CvAnalysisInfraRepository implements ICvAnalysisRepository {
  constructor(private readonly cvAnalysisPrisma: CvAnalysisPrismaRepository) {}

  async findByCvId(cvId: string): Promise<CvAnalysis | null> {
    const raw = await this.cvAnalysisPrisma.findByCvId(cvId);
    return CvAnalysisMapper.toDomain(raw);
  }

  async save(analysis: CvAnalysis): Promise<CvAnalysis> {
    const data = CvAnalysisMapper.toPersistence(analysis);
    const raw = await this.cvAnalysisPrisma.upsert(data);
    return CvAnalysisMapper.toDomain(raw)!;
  }

  async findPendingCvIds(limit: number): Promise<string[]> {
    return this.cvAnalysisPrisma.findPendingCvIds(limit);
  }

  async searchCandidatePool(
    filters: CandidateSearchFilters,
  ): Promise<CandidateSearchResult[]> {
    const rows = await this.cvAnalysisPrisma.searchCandidatePool(filters);
    return rows
      .map((row) => toCandidateSearchResult(row))
      .filter((row): row is CandidateSearchResult => row !== null);
  }

  async findCandidateByUserId(
    userId: string,
  ): Promise<CandidateSearchResult | null> {
    const row = await this.cvAnalysisPrisma.findCandidateByUserId(userId);
    if (!row) return null;
    return toCandidateSearchResult(row);
  }

  async findCvFileInfo(cvId: string): Promise<CvFileInfo | null> {
    const raw = await this.cvAnalysisPrisma.findCvFileInfo(cvId);
    if (!raw) return null;
    return {
      cvId: raw.id,
      userId: raw.userId,
      fileKey: raw.fileKey,
      mimeType: raw.mimeType,
      fileType: raw.fileType,
    };
  }
}
