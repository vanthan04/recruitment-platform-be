import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';

export class CompanyMapper {
  static toDomain(raw: any): Company | null {
    if (!raw) return null;

    return new Company({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      logoUrl: raw.logoUrl,
      description: raw.description,
      website: raw.website,
      industry: raw.industry,
      size: raw.size as CompanySize | null,
      address: raw.address,
      ownerId: raw.ownerId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(company: Company): any {
    return {
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      description: company.description,
      website: company.website,
      industry: company.industry,
      size: company.size,
      address: company.address,
      ownerId: company.ownerId,
      deletedAt: company.deletedAt,
    };
  }
}
