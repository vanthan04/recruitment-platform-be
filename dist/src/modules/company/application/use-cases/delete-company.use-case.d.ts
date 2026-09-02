import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
export declare class DeleteCompanyUseCase {
    private readonly companyRepository;
    constructor(companyRepository: ICompanyRepository);
    execute(ownerId: string, companyId: string): Promise<void>;
}
