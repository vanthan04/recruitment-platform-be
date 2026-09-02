import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
export interface CreateCompanyInput {
    name: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    industry?: string;
    size?: CompanySize;
    address?: string;
}
export declare class CreateCompanyUseCase {
    private readonly companyRepository;
    private readonly userRepository;
    constructor(companyRepository: ICompanyRepository, userRepository: IUserRepository);
    execute(ownerId: string, input: CreateCompanyInput): Promise<CompanyResponseDto>;
    private generateUniqueSlug;
}
