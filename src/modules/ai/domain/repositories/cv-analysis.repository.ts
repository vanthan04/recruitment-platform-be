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
  /**
   * Restricts the pool to candidates who have applied to this job — AI
   * candidate discovery is scoped to the recruiter's own applicant pool per
   * job, never a platform-wide résumé search (see get_applications, which
   * already worked this way). Required, not optional: every caller has an
   * authorized jobId in scope by construction (AiMatchingService,
   * search-candidates.tool.ts) and none should be able to omit it.
   */
  jobId: string;
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
   * Atomically claims up to `limit` CVs with no analysis yet, or left
   * PENDING/FAILED by a previous attempt — consumed by the
   * analyze-pending-cvs safety-net cron. "Claims" means: for each returned
   * cvId, this call itself sets/creates a CvAnalysis row with
   * `processingStartedAt = now()` before returning, so a CV already claimed
   * by an in-flight call is excluded from the *next* cron tick unless that
   * claim is older than `staleAfterMs` (meaning the process that claimed it
   * likely died without ever calling save()). See CvAnalysis.
   * processingStartedAt's doc comment for the failure mode this prevents.
   */
  abstract claimPendingCvIds(
    limit: number,
    staleAfterMs: number,
  ): Promise<string[]>;
  /**
   * The deterministic filtering step: only ever searches CVs whose analysis
   * is COMPLETED (filtering can't depend on the AI step it's meant to gate —
   * see CvAnalysisStatus doc comment in schema.prisma).
   */
  abstract searchCandidatePool(
    filters: CandidateSearchFilters,
  ): Promise<CandidateSearchResult[]>;
  /**
   * Single candidate's analyzed profile, for the get_candidate tool — `jobId`
   * scopes this to the recruiter's own applicant pool (same rule as
   * searchCandidatePool): returns null if this candidate has no application
   * for that job, even if the candidate/analysis otherwise exists.
   */
  abstract findCandidateByUserId(
    userId: string,
    jobId: string,
  ): Promise<CandidateSearchResult | null>;
  /**
   * One CV's structured analysis by id, for the get_cv_analysis tool —
   * `jobId`-scoped the same way as findCandidateByUserId. Deliberately a
   * separate method from findByCvId (used internally by CvAnalysisService
   * to check for an existing analysis before running one, with no job in
   * scope at all) rather than adding a required jobId there.
   */
  abstract findByCvIdForJob(
    cvId: string,
    jobId: string,
  ): Promise<CvAnalysis | null>;
  /** File metadata needed to download+extract a CV's text — never the analysis itself. */
  abstract findCvFileInfo(cvId: string): Promise<CvFileInfo | null>;
}
