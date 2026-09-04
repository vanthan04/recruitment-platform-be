import { BaseEntity } from '@/common/domain/base.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvAlreadyPublishedException,
  CvAlreadyDraftException,
  CvAlreadyDeletedException,
  CvNotDeletedException,
  CvOwnershipException,
  CvTitleRequiredException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

/**
 * CV Aggregate Root — file-only. A CV is a title plus an uploaded file's
 * metadata; there is no CV builder content (experience/education/skills).
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Cv extends BaseEntity {
  title: string;
  originalName: string;
  fileType: CvFileType;
  mimeType: string;
  fileSize: number | null;
  fileKey: string;
  status: CvStatus;
  deletedAt: Date | null;
  userId: string;

  constructor(partial: Partial<Cv>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? CvStatus.PUBLISHED;
    this.fileSize = partial.fileSize ?? null;
    this.deletedAt = partial.deletedAt ?? null;
  }

  // ─── Business Logic ──────────────────────────────────

  publish(): void {
    if (this.status === CvStatus.PUBLISHED) {
      throw new CvAlreadyPublishedException();
    }
    this.status = CvStatus.PUBLISHED;
  }

  unpublish(): void {
    if (this.status === CvStatus.DRAFT) {
      throw new CvAlreadyDraftException();
    }
    this.status = CvStatus.DRAFT;
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new CvAlreadyDeletedException();
    }
    this.deletedAt = new Date();
  }

  restore(): void {
    if (!this.deletedAt) {
      throw new CvNotDeletedException();
    }
    this.deletedAt = null;
  }

  ensureOwner(userId: string): void {
    if (this.userId !== userId) {
      throw new CvOwnershipException();
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

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new CvTitleRequiredException();
    }
    this.title = title.trim();
  }
}
