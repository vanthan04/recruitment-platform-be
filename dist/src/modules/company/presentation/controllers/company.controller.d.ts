import { CreateCompanyUseCase } from '@/modules/company/application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@/modules/company/application/use-cases/update-company.use-case';
import { GetCompanyUseCase } from '@/modules/company/application/use-cases/get-company.use-case';
import { ListCompaniesUseCase } from '@/modules/company/application/use-cases/list-companies.use-case';
import { DeleteCompanyUseCase } from '@/modules/company/application/use-cases/delete-company.use-case';
import { CreateCompanyDto } from '@/modules/company/presentation/dtos/create-company.dto';
import { UpdateCompanyDto } from '@/modules/company/presentation/dtos/update-company.dto';
import { SearchCompanyDto } from '@/modules/company/presentation/dtos/search-company.dto';
export declare class CompanyController {
    private readonly createCompanyUseCase;
    private readonly updateCompanyUseCase;
    private readonly getCompanyUseCase;
    private readonly listCompaniesUseCase;
    private readonly deleteCompanyUseCase;
    constructor(createCompanyUseCase: CreateCompanyUseCase, updateCompanyUseCase: UpdateCompanyUseCase, getCompanyUseCase: GetCompanyUseCase, listCompaniesUseCase: ListCompaniesUseCase, deleteCompanyUseCase: DeleteCompanyUseCase);
    create(recruiterId: string, dto: CreateCompanyDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/company-response.dto").CompanyResponseDto>>;
    list(query: SearchCompanyDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/company-response.dto").CompanyResponseDto>>;
    getById(id: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/company-response.dto").CompanyResponseDto & {
        openJobs: import("../../../job/application/dto/job-response.dto").JobResponseDto[];
    }>>;
    update(recruiterId: string, companyId: string, dto: UpdateCompanyDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/company-response.dto").CompanyResponseDto>>;
    delete(recruiterId: string, companyId: string): Promise<void>;
}
