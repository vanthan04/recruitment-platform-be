import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
export interface UpdateCompanyInput {
    name?: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    industry?: string;
    size?: CompanySize;
    address?: string;
}
export declare class UpdateCompanyUseCase {
    private readonly companyRepository;
    constructor(companyRepository: ICompanyRepository);
    execute(ownerId: string, companyId: string, input: UpdateCompanyInput): Promise<CompanyResponseDto>;
}
