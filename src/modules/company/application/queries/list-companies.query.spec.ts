import {
  ListCompaniesQuery,
  ListCompaniesHandler,
} from '@/modules/company/application/queries/list-companies.query';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('ListCompaniesHandler', () => {
  let handler: ListCompaniesHandler;
  let companyRepository: jest.Mocked<ICompanyRepository>;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByOwnerId: jest.fn(),
      existsBySlug: jest.fn(),
      findAllPaginated: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new ListCompaniesHandler(companyRepository);
  });

  it('passes the pagination/filter input straight through to the repository', async () => {
    companyRepository.findAllPaginated.mockResolvedValue({
      companies: [],
      total: 0,
    });

    await handler.execute(
      new ListCompaniesQuery({
        page: 2,
        limit: 10,
        keyword: 'acme',
      }),
    );

    expect(companyRepository.findAllPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      keyword: 'acme',
    });
  });

  it('maps companies to DTOs and echoes page/limit', async () => {
    companyRepository.findAllPaginated.mockResolvedValue({
      companies: [
        new Company({ id: 'c1', name: 'Acme', slug: 'acme', ownerId: 'o1' }),
      ],
      total: 1,
    });

    const result = await handler.execute(
      new ListCompaniesQuery({ page: 1, limit: 20 }),
    );

    expect(result).toEqual({
      companies: [expect.objectContaining({ id: 'c1', slug: 'acme' })],
      total: 1,
      page: 1,
      limit: 20,
    });
  });
});
