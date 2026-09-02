import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
export interface ListCompaniesInput {
    page: number;
    limit: number;
    keyword?: string;
    industry?: string;
}
export declare class ListCompaniesUseCase {
    private readonly companyRepository;
    constructor(companyRepository: ICompanyRepository);
    execute(input: ListCompaniesInput): Promise<{
        companies: CompanyResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
