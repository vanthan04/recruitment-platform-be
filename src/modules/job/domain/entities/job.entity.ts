import { BaseEntity } from '@/common/domain/base.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import {
  JobAlreadyOpenException,
  JobAlreadyClosedException,
  JobNotClosedException,
  JobAlreadyDeletedException,
  JobOwnershipException,
} from '@/modules/job/domain/exceptions/job.exceptions';

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
 * Lightweight read-only snapshot of an assigned Skill, attached when the
 * infrastructure layer joins the relation. Not part of Job's own persistence.
 */
export interface SkillSummary {
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
  employmentType: EmploymentType;
  workMode: WorkMode;
  level: JobLevel | null;
  status: JobStatus;
  viewCount: number;
  salary: SalaryRange;
  requirements: string | null;
  benefits: string | null;
  workingHours: string | null;
  applicationMethod: string | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  postedById: string;
  skills: SkillSummary[];

  constructor(partial: Partial<Job>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? JobStatus.DRAFT;
    this.employmentType = partial.employmentType ?? EmploymentType.FULL_TIME;
    this.workMode = partial.workMode ?? WorkMode.ONSITE;
    this.skills = partial.skills ?? [];
    this.level = partial.level ?? null;
    this.categoryId = partial.categoryId ?? null;
    this.viewCount = partial.viewCount ?? 0;
    this.deletedAt = partial.deletedAt ?? null;
  }

  // ─── Business Logic ──────────────────────────────────

  open(): void {
    if (this.status === JobStatus.OPEN) {
      throw new JobAlreadyOpenException();
    }
    this.status = JobStatus.OPEN;
  }

  close(): void {
    if (this.status === JobStatus.CLOSED) {
      throw new JobAlreadyClosedException();
    }
    this.status = JobStatus.CLOSED;
  }

  reopen(): void {
    if (this.status !== JobStatus.CLOSED) {
      throw new JobNotClosedException();
    }
    this.status = JobStatus.OPEN;
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new JobAlreadyDeletedException();
    }
    this.deletedAt = new Date();
    this.status = JobStatus.CLOSED;
  }

  ensureOwner(userId: string): void {
    if (this.postedById !== userId) {
      throw new JobOwnershipException();
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
    employmentType?: EmploymentType;
    workMode?: WorkMode;
    level?: JobLevel | null;
    categoryId?: string | null;
    requirements?: string;
    benefits?: string;
    workingHours?: string;
    applicationMethod?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    expiresAt?: Date;
  }): void {
    if (data.title) this.title = data.title;
    if (data.description) this.description = data.description;
    if (data.location) this.location = data.location;
    if (data.employmentType) this.employmentType = data.employmentType;
    if (data.workMode) this.workMode = data.workMode;
    if (data.level !== undefined) this.level = data.level;
    if (data.categoryId !== undefined) this.categoryId = data.categoryId;
    if (data.requirements !== undefined) this.requirements = data.requirements;
    if (data.benefits !== undefined) this.benefits = data.benefits;
    if (data.workingHours !== undefined) this.workingHours = data.workingHours;
    if (data.applicationMethod !== undefined)
      this.applicationMethod = data.applicationMethod;
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
