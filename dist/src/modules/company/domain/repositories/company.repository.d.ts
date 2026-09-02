import { Company } from '@/modules/company/domain/entities/company.entity';
export declare abstract class ICompanyRepository {
    abstract findById(id: string): Promise<Company | null>;
    abstract findBySlug(slug: string): Promise<Company | null>;
    abstract findByOwnerId(ownerId: string): Promise<Company | null>;
    abstract existsBySlug(slug: string): Promise<boolean>;
    abstract findAllPaginated(params: {
        page: number;
        limit: number;
        keyword?: string;
        industry?: string;
    }): Promise<{
        companies: Company[];
        total: number;
    }>;
    abstract save(company: Company): Promise<Company>;
    abstract update(company: Company): Promise<Company>;
    abstract delete(id: string): Promise<void>;
}
