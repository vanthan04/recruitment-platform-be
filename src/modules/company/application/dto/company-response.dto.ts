import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';

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
  industry: string | null;
  size: CompanySize | null;
  address: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
