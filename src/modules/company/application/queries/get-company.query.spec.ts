import {
  GetCompanyQuery,
  GetCompanyHandler,
} from '@/modules/company/application/queries/get-company.query';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyNotFoundException } from '@/modules/company/domain/exceptions/company.exceptions';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('GetCompanyHandler', () => {
  let handler: GetCompanyHandler;
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

    handler = new GetCompanyHandler(companyRepository);
  });

  it('throws CompanyNotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetCompanyQuery('company-1')),
    ).rejects.toThrow(CompanyNotFoundException);
  });

  it('returns the company DTO when found', async () => {
    companyRepository.findById.mockResolvedValue(
      new Company({
        id: 'company-1',
        name: 'Acme',
        slug: 'acme',
        ownerId: 'owner-1',
      }),
    );

    const result = await handler.execute(new GetCompanyQuery('company-1'));

    expect(result.id).toBe('company-1');
    expect(result.slug).toBe('acme');
  });
});
