import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export class GetCompanyQuery {
  constructor(public readonly companyId: string) {}
}

@Injectable()
@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler implements IQueryHandler<
  GetCompanyQuery,
  CompanyResponseDto
> {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  // No dependency on `job` here — per MICROSERVICES_MIGRATION_PLAN.md the
  // arrow only ever runs Jobs -> Companies, never the reverse. A client
  // wanting this company's open jobs calls GET /jobs?companyId=... directly.
  async execute({ companyId }: GetCompanyQuery): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new EntityNotFoundException('Company', companyId);
    }

    return CompanyResponseMapper.toDto(company);
  }
}
