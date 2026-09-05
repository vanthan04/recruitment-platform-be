import { Company } from '@/modules/company/domain/entities/company.entity';

/**
 * Company Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 */
export abstract class ICompanyRepository {
  abstract findById(id: string): Promise<Company | null>;
  abstract findManyByIds(ids: string[]): Promise<Company[]>;
  abstract findBySlug(slug: string): Promise<Company | null>;
  abstract findByOwnerId(ownerId: string): Promise<Company | null>;
  abstract existsBySlug(slug: string): Promise<boolean>;
  abstract findAllPaginated(params: {
    page: number;
    limit: number;
    keyword?: string;
  }): Promise<{ companies: Company[]; total: number }>;
  abstract save(company: Company): Promise<Company>;
  /** Atomically creates the company and links it to `company.ownerId`'s User row. */
  abstract saveWithOwnerLink(company: Company): Promise<Company>;
  abstract update(company: Company): Promise<Company>;
  abstract delete(id: string): Promise<void>;
}
