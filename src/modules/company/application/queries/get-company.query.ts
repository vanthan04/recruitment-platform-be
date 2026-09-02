import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { IJobSearchPort } from '@/modules/company/application/ports/job-search.port';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export class GetCompanyQuery {
  constructor(public readonly companyId: string) {}
}

@Injectable()
@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler
  implements IQueryHandler<GetCompanyQuery, CompanyResponseDto & { openJobs: JobResponseDto[] }>
{
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly jobSearchPort: IJobSearchPort,
  ) {}

  async execute({
    companyId,
  }: GetCompanyQuery): Promise<CompanyResponseDto & { openJobs: JobResponseDto[] }> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new EntityNotFoundException('Company', companyId);
    }

    const openJobs = await this.jobSearchPort.findOpenJobsByCompany(company.id);

    return {
      ...CompanyResponseMapper.toDto(company),
      openJobs,
    };
  }
}
