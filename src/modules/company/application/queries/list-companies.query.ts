import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface ListCompaniesInput {
  page: number;
  limit: number;
  keyword?: string;
}

export class ListCompaniesQuery {
  constructor(public readonly input: ListCompaniesInput) {}
}

export interface ListCompaniesResult {
  companies: CompanyResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<
  ListCompaniesQuery,
  ListCompaniesResult
> {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute({ input }: ListCompaniesQuery): Promise<ListCompaniesResult> {
    const { companies, total } =
      await this.companyRepository.findAllPaginated(input);

    return {
      companies: CompanyResponseMapper.toDtoList(companies),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
