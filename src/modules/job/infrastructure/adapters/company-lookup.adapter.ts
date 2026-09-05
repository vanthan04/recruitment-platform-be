import { Injectable } from '@nestjs/common';
import {
  ICompanyLookupPort,
  JobCompanySummary,
} from '@/modules/job/application/ports/company-lookup.port';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';

const KEYWORD_SEARCH_LIMIT = 100;

@Injectable()
export class CompanyLookupAdapter implements ICompanyLookupPort {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async findManyByIds(ids: string[]): Promise<Map<string, JobCompanySummary>> {
    const uniqueIds = [...new Set(ids)];
    const companies = await this.companyRepository.findManyByIds(uniqueIds);

    const summaries = new Map<string, JobCompanySummary>();
    for (const company of companies) {
      summaries.set(company.id, {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
      });
    }
    return summaries;
  }

  async searchIdsByKeyword(keyword: string): Promise<string[]> {
    const { companies } = await this.companyRepository.findAllPaginated({
      page: 1,
      limit: KEYWORD_SEARCH_LIMIT,
      keyword,
    });
    return companies.map((company) => company.id);
  }
}
