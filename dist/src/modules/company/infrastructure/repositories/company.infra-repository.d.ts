import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanyPrismaRepository } from '@/modules/company/infrastructure/persistence/prisma/company-prisma.repository';
export declare class CompanyInfraRepository implements ICompanyRepository {
    private readonly companyPrisma;
    constructor(companyPrisma: CompanyPrismaRepository);
    findById(id: string): Promise<Company | null>;
    findBySlug(slug: string): Promise<Company | null>;
    findByOwnerId(ownerId: string): Promise<Company | null>;
    existsBySlug(slug: string): Promise<boolean>;
    findAllPaginated(params: {
        page: number;
        limit: number;
        keyword?: string;
        industry?: string;
    }): Promise<{
        companies: Company[];
        total: number;
    }>;
    save(company: Company): Promise<Company>;
    update(company: Company): Promise<Company>;
    delete(id: string): Promise<void>;
}
