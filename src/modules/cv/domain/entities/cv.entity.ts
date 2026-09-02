import { BaseEntity } from '@/common/domain/base.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { Education } from '@/modules/cv/domain/entities/education.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * CV Aggregate Root.
 * Contains all business logic for CV management.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Cv extends BaseEntity {
  title: string;
  summary: string | null;
  fileUrl: string | null;
  status: CvStatus;
  publishedAt: Date | null;
  deletedAt: Date | null;
  userId: string;

  experiences: Experience[];
  educations: Education[];
  skills: Skill[];

  constructor(partial: Partial<Cv>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? CvStatus.DRAFT;
    this.fileUrl = partial.fileUrl ?? null;
    this.experiences = partial.experiences ?? [];
    this.educations = partial.educations ?? [];
    this.skills = partial.skills ?? [];
    this.publishedAt = partial.publishedAt ?? null;
    this.deletedAt = partial.deletedAt ?? null;
  }

  // ─── Business Logic ──────────────────────────────────

  /**
   * Publish the CV. Requires at least one experience or education.
   */
  publish(): void {
    if (this.status === CvStatus.PUBLISHED) {
      throw new BusinessRuleViolationException('CV is already published');
    }

    if (this.experiences.length === 0 && this.educations.length === 0) {
      throw new BusinessRuleViolationException(
        'CV must have at least one experience or education to be published',
      );
    }

    this.status = CvStatus.PUBLISHED;
    this.publishedAt = new Date();
  }

  /**
   * Unpublish (revert to draft).
   */
  unpublish(): void {
    if (this.status === CvStatus.DRAFT) {
      throw new BusinessRuleViolationException('CV is already in draft');
    }

    this.status = CvStatus.DRAFT;
    this.publishedAt = null;
  }

  /**
   * Soft delete.
   */
  softDelete(): void {
    if (this.deletedAt) {
      throw new BusinessRuleViolationException('CV is already deleted');
    }
    this.deletedAt = new Date();
    this.status = CvStatus.DRAFT;
  }

  /**
   * Restore from soft delete.
   */
  restore(): void {
    if (!this.deletedAt) {
      throw new BusinessRuleViolationException('CV is not deleted');
    }
    this.deletedAt = null;
  }

  /**
   * Guard: Ensure the given userId is the owner.
   */
  ensureOwner(userId: string): void {
    if (this.userId !== userId) {
      throw new UnauthorizedDomainException('You are not the owner of this CV');
    }
  }

  get isPublished(): boolean {
    return this.status === CvStatus.PUBLISHED;
  }

  get isDraft(): boolean {
    return this.status === CvStatus.DRAFT;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // ─── Aggregate Collection Methods ────────────────────

  addExperience(experience: Experience): void {
    this.experiences.push(experience);
  }

  addEducation(education: Education): void {
    this.educations.push(education);
  }

  addSkill(skill: Skill): void {
    // Prevent duplicate skill names
    const exists = this.skills.some(
      (s) => s.name.toLowerCase() === skill.name.toLowerCase(),
    );
    if (exists) {
      throw new BusinessRuleViolationException(
        `Skill "${skill.name}" already exists in this CV`,
      );
    }
    this.skills.push(skill);
  }

  removeSkill(skillId: string): void {
    this.skills = this.skills.filter((s) => s.id !== skillId);
  }

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new BusinessRuleViolationException('CV title cannot be empty');
    }
    this.title = title.trim();
  }

  updateSummary(summary: string | null): void {
    this.summary = summary?.trim() ?? null;
  }

  attachFile(fileUrl: string): void {
    this.fileUrl = fileUrl;
  }
}
