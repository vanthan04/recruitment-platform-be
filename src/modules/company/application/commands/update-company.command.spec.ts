import {
  UpdateCompanyCommand,
  UpdateCompanyHandler,
} from '@/modules/company/application/commands/update-company.command';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import {
  CompanyNotFoundException,
  CompanyOwnershipException,
} from '@/modules/company/domain/exceptions/company.exceptions';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('UpdateCompanyHandler', () => {
  let handler: UpdateCompanyHandler;
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

    handler = new UpdateCompanyHandler(companyRepository);
  });

  it('throws CompanyNotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateCompanyCommand('owner-1', 'company-1', { name: 'New' }),
      ),
    ).rejects.toThrow(CompanyNotFoundException);
  });

  it('throws CompanyOwnershipException when the caller is not the owner', async () => {
    companyRepository.findById.mockResolvedValue(
      new Company({
        id: 'company-1',
        name: 'Acme',
        slug: 'acme',
        ownerId: 'owner-1',
      }),
    );

    await expect(
      handler.execute(
        new UpdateCompanyCommand('someone-else', 'company-1', { name: 'New' }),
      ),
    ).rejects.toThrow(CompanyOwnershipException);
    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  it('updates the company details and persists them', async () => {
    companyRepository.findById.mockResolvedValue(
      new Company({
        id: 'company-1',
        name: 'Acme',
        slug: 'acme',
        ownerId: 'owner-1',
      }),
    );
    companyRepository.update.mockImplementation(async (c) => c);

    const result = await handler.execute(
      new UpdateCompanyCommand('owner-1', 'company-1', {
        name: 'Acme Renamed',
        industry: 'Fintech',
      }),
    );

    expect(result.name).toBe('Acme Renamed');
    expect(companyRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Renamed', industry: 'Fintech' }),
    );
  });
});
