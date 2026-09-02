import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface ListCompaniesInput {
  page: number;
  limit: number;
  keyword?: string;
  industry?: string;
}

@Injectable()
export class ListCompaniesUseCase {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(
    input: ListCompaniesInput,
  ): Promise<{ companies: CompanyResponseDto[]; total: number; page: number; limit: number }> {
    const { companies, total } = await this.companyRepository.findAllPaginated(input);

    return {
      companies: CompanyResponseMapper.toDtoList(companies),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
