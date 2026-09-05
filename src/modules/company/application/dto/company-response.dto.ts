import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';

/**
 * Company Response DTO — Application layer output.
 */
export class CompanyResponseDto {
  id: string;
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
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
