import { BaseEntity } from '@/common/domain/base.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Lightweight read-only snapshot of the owning Company, attached when the
 * infrastructure layer joins the relation. Not part of Job's own persistence.
 */
export interface CompanySummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

/**
 * Lightweight read-only snapshot of the assigned Category, attached when the
 * infrastructure layer joins the relation. Not part of Job's own persistence.
 */
export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * Job entity — aggregate root.
 * Contains all business logic for job management.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Job extends BaseEntity {
  title: string;
  description: string;
  companyId: string;
  company?: CompanySummary | null;
  categoryId: string | null;
  category?: CategorySummary | null;
  location: string;
  jobType: JobType;
  level: JobLevel | null;
  status: JobStatus;
  viewCount: number;
  salary: SalaryRange;
  requirements: string | null;
  benefits: string | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  postedById: string;

  constructor(partial: Partial<Job>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? JobStatus.DRAFT;
    this.jobType = partial.jobType ?? JobType.FULL_TIME;
    this.level = partial.level ?? null;
    this.categoryId = partial.categoryId ?? null;
    this.viewCount = partial.viewCount ?? 0;
    this.deletedAt = partial.deletedAt ?? null;
  }

  // ─── Business Logic ──────────────────────────────────

  open(): void {
    if (this.status === JobStatus.OPEN) {
      throw new BusinessRuleViolationException('Job is already open');
    }
    this.status = JobStatus.OPEN;
  }

  close(): void {
    if (this.status === JobStatus.CLOSED) {
      throw new BusinessRuleViolationException('Job is already closed');
    }
    this.status = JobStatus.CLOSED;
  }

  reopen(): void {
    if (this.status !== JobStatus.CLOSED) {
      throw new BusinessRuleViolationException(
        'Only closed jobs can be reopened',
      );
    }
    this.status = JobStatus.OPEN;
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new BusinessRuleViolationException('Job is already deleted');
    }
    this.deletedAt = new Date();
    this.status = JobStatus.CLOSED;
  }

  ensureOwner(userId: string): void {
    if (this.postedById !== userId) {
      throw new UnauthorizedDomainException(
        'You are not the owner of this job posting',
      );
    }
  }

  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }

  get isOpen(): boolean {
    return this.status === JobStatus.OPEN && !this.isExpired && !this.deletedAt;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  belongsTo(userId: string): boolean {
    return this.postedById === userId;
  }

  updateDetails(data: {
    title?: string;
    description?: string;
    location?: string;
    jobType?: JobType;
    level?: JobLevel | null;
    categoryId?: string | null;
    requirements?: string;
    benefits?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    expiresAt?: Date;
  }): void {
    if (data.title) this.title = data.title;
    if (data.description) this.description = data.description;
    if (data.location) this.location = data.location;
    if (data.jobType) this.jobType = data.jobType;
    if (data.level !== undefined) this.level = data.level;
    if (data.categoryId !== undefined) this.categoryId = data.categoryId;
    if (data.requirements !== undefined) this.requirements = data.requirements;
    if (data.benefits !== undefined) this.benefits = data.benefits;
    if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt;

    if (
      data.salaryMin !== undefined ||
      data.salaryMax !== undefined ||
      data.currency !== undefined
    ) {
      this.salary = new SalaryRange(
        data.salaryMin ?? this.salary?.min ?? null,
        data.salaryMax ?? this.salary?.max ?? null,
        data.currency ?? this.salary?.currency ?? 'VND',
      );
    }
  }
}
