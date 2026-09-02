import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

@Injectable()
export class GetCompanyUseCase {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly jobRepository: IJobRepository,
  ) {}

  async execute(
    companyId: string,
  ): Promise<CompanyResponseDto & { openJobs: JobResponseDto[] }> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new EntityNotFoundException('Company', companyId);
    }

    const { jobs } = await this.jobRepository.findAllPaginated({
      page: 1,
      limit: 50,
      companyId: company.id,
    });

    return {
      ...CompanyResponseMapper.toDto(company),
      openJobs: JobResponseMapper.toDtoList(jobs),
    };
  }
}
