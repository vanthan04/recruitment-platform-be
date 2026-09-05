import { BaseEntity } from '@/common/domain/base.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';
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
  size: CompanySize | null;
  companyType: CompanyType | null;
  address: string | null;
  province: string | null;
  ward: string | null;
  deletedAt: Date | null;
  ownerId: string;

  constructor(partial: Partial<Company>) {
    super();
    Object.assign(this, partial);
    this.logoUrl = partial.logoUrl ?? null;
    this.description = partial.description ?? null;
    this.website = partial.website ?? null;
    this.size = partial.size ?? null;
    this.companyType = partial.companyType ?? null;
    this.address = partial.address ?? null;
    this.province = partial.province ?? null;
    this.ward = partial.ward ?? null;
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
    size?: CompanySize | null;
    companyType?: CompanyType | null;
    address?: string | null;
    province?: string | null;
    ward?: string | null;
  }): void {
    if (data.name) this.name = data.name;
    if (data.logoUrl !== undefined) this.logoUrl = data.logoUrl;
    if (data.description !== undefined) this.description = data.description;
    if (data.website !== undefined) this.website = data.website;
    if (data.size !== undefined) this.size = data.size;
    if (data.companyType !== undefined) this.companyType = data.companyType;
    if (data.address !== undefined) this.address = data.address;
    if (data.province !== undefined) this.province = data.province;
    if (data.ward !== undefined) this.ward = data.ward;
  }
}
