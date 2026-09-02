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
    const companies = await Promise.all(
      uniqueIds.map((id) => this.companyRepository.findById(id)),
    );

    const summaries = new Map<string, JobCompanySummary>();
    companies.forEach((company, index) => {
      if (!company) return;
      summaries.set(uniqueIds[index], {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
      });
    });
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
