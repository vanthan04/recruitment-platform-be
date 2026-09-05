import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';

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
      size: raw.size as CompanySize | null,
      companyType: raw.companyType as CompanyType | null,
      address: raw.address,
      province: raw.province,
      ward: raw.ward,
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
      size: company.size,
      companyType: company.companyType,
      address: company.address,
      province: company.province,
      ward: company.ward,
      ownerId: company.ownerId,
      deletedAt: company.deletedAt,
    };
  }
}
