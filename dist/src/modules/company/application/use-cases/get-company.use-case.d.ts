import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export declare class GetCompanyUseCase {
    private readonly companyRepository;
    private readonly jobRepository;
    constructor(companyRepository: ICompanyRepository, jobRepository: IJobRepository);
    execute(companyId: string): Promise<CompanyResponseDto & {
        openJobs: JobResponseDto[];
    }>;
}
