import { BaseEntity } from '@/common/domain/base.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import {
  CompanyOwnershipException,
  CompanyAlreadyDeletedException,
} from '@/modules/company/domain/exceptions/company.exceptions';

/**
 * Company Aggregate Root.
 * Contains all business logic for company management.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Company extends BaseEntity {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  size: CompanySize | null;
  address: string | null;
  deletedAt: Date | null;
  ownerId: string;

  constructor(partial: Partial<Company>) {
    super();
    Object.assign(this, partial);
    this.logoUrl = partial.logoUrl ?? null;
    this.description = partial.description ?? null;
    this.website = partial.website ?? null;
    this.industry = partial.industry ?? null;
    this.size = partial.size ?? null;
    this.address = partial.address ?? null;
    this.deletedAt = partial.deletedAt ?? null;
  }

  // ─── Business Logic ──────────────────────────────────

  ensureOwner(userId: string): void {
    if (this.ownerId !== userId) {
      throw new CompanyOwnershipException();
    }
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new CompanyAlreadyDeletedException();
    }
    this.deletedAt = new Date();
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  updateDetails(data: {
    name?: string;
    logoUrl?: string | null;
    description?: string | null;
    website?: string | null;
    industry?: string | null;
    size?: CompanySize | null;
    address?: string | null;
  }): void {
    if (data.name) this.name = data.name;
    if (data.logoUrl !== undefined) this.logoUrl = data.logoUrl;
    if (data.description !== undefined) this.description = data.description;
    if (data.website !== undefined) this.website = data.website;
    if (data.industry !== undefined) this.industry = data.industry;
    if (data.size !== undefined) this.size = data.size;
    if (data.address !== undefined) this.address = data.address;
  }
}
