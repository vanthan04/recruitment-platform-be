import { CvAnalysis } from '@/modules/ai/domain/entities/cv-analysis.entity';

export interface CvFileInfo {
  cvId: string;
  userId: string;
  fileKey: string;
  mimeType: string;
  fileType: string;
}

export interface CandidateSearchFilters {
  /** Normalized (trimmed, lowercased) skill names — see normalizeSkills(). */
  skills: string[];
  minExperienceYears?: number;
  /** Deterministic pool size cap — see AI_MAX_CANDIDATES. */
  limit: number;
}

/**
 * One row of the deterministic candidate pool — a read-model joining
 * User -> Profile -> Cv -> CvAnalysis, not a persistence shape of any single
 * aggregate. Intentionally excludes PII the AI ranking step has no business
 * need for (email, phone, birthDate) — see AiCandidatePoolRow's callers.
 */
export interface CandidateSearchResult {
  candidateId: string;
  fullName: string;
  headline: string | null;
  cvId: string;
  skills: string[];
  experienceYears: number | null;
  education: string[];
  summary: string | null;
}

/**
 * CvAnalysis Repository interface (port). Defined in the domain layer —
 * implementation lives in infrastructure. Uses an abstract class for NestJS
 * DI compatibility, matching every other module's repository interface.
 */
export abstract class ICvAnalysisRepository {
  abstract findByCvId(cvId: string): Promise<CvAnalysis | null>;
  /** Upsert by cvId — one CvAnalysis row per Cv. */
  abstract save(analysis: CvAnalysis): Promise<CvAnalysis>;
  /**
   * CV ids with no analysis yet, or left PENDING/FAILED by a previous
   * attempt — consumed by the analyze-pending-cvs safety-net cron.
   */
  abstract findPendingCvIds(limit: number): Promise<string[]>;
  /**
   * The deterministic filtering step: only ever searches CVs whose analysis
   * is COMPLETED (filtering can't depend on the AI step it's meant to gate —
   * see CvAnalysisStatus doc comment in schema.prisma).
   */
  abstract searchCandidatePool(
    filters: CandidateSearchFilters,
  ): Promise<CandidateSearchResult[]>;
  /** Single candidate's analyzed profile, for the getCandidate/getCvAnalysis tools. */
  abstract findCandidateByUserId(
    userId: string,
  ): Promise<CandidateSearchResult | null>;
  /** File metadata needed to download+extract a CV's text — never the analysis itself. */
  abstract findCvFileInfo(cvId: string): Promise<CvFileInfo | null>;
}
