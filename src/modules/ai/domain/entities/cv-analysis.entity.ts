import { BaseEntity } from '@/common/domain/base.entity';
import { CvAnalysisStatus } from '@/modules/ai/domain/value-objects/cv-analysis-status.vo';

/**
 * CvAnalysis aggregate root — structured, AI-extracted facts about one Cv's
 * content, produced once and reused by every later candidate search/match.
 * Framework-agnostic — no NestJS or Prisma imports.
 *
 * Owned by the `ai` module rather than the `cv` module: this avoids a
 * circular module import (`ai` already imports `cv` one-directionally for
 * job/candidate/file-storage lookups; if `cv` also imported `ai` to persist
 * analysis results, that would cycle). `cvId` is treated as an opaque
 * cross-aggregate foreign key, same as `JobApplication.cvId` elsewhere.
 */
export class CvAnalysis extends BaseEntity {
  cvId: string;
  status: CvAnalysisStatus;
  summary: string | null;
  /** Normalized (trimmed, lowercased) for `hasSome` search matching. */
  skills: string[];
  experienceYears: number | null;
  education: string[];
  /** Never logged or returned through any API — kept only to re-run analysis if the model changes. */
  extractedText: string | null;
  model: string | null;
  analyzedAt: Date | null;
  failureReason: string | null;

  constructor(partial: Partial<CvAnalysis>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? CvAnalysisStatus.PENDING;
    this.summary = partial.summary ?? null;
    this.skills = partial.skills ?? [];
    this.experienceYears = partial.experienceYears ?? null;
    this.education = partial.education ?? [];
    this.extractedText = partial.extractedText ?? null;
    this.model = partial.model ?? null;
    this.analyzedAt = partial.analyzedAt ?? null;
    this.failureReason = partial.failureReason ?? null;
  }

  markCompleted(result: {
    summary: string;
    skills: string[];
    experienceYears: number | null;
    education: string[];
    extractedText: string;
    model: string;
  }): void {
    this.status = CvAnalysisStatus.COMPLETED;
    this.summary = result.summary;
    this.skills = normalizeSkills(result.skills);
    this.experienceYears = result.experienceYears;
    this.education = result.education;
    this.extractedText = result.extractedText;
    this.model = result.model;
    this.analyzedAt = new Date();
    this.failureReason = null;
  }

  markFailed(reason: string): void {
    this.status = CvAnalysisStatus.FAILED;
    this.failureReason = reason;
    this.analyzedAt = new Date();
  }

  get isSearchable(): boolean {
    return this.status === CvAnalysisStatus.COMPLETED;
  }
}

/** Trimmed + lowercased, de-duplicated — shared by entity writes and search filters so both sides compare consistently. */
export function normalizeSkills(skills: string[]): string[] {
  return Array.from(
    new Set(
      skills.map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0),
    ),
  );
}
