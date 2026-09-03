import {
  DeleteCompanyCommand,
  DeleteCompanyHandler,
} from '@/modules/company/application/commands/delete-company.command';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import {
  CompanyNotFoundException,
  CompanyOwnershipException,
} from '@/modules/company/domain/exceptions/company.exceptions';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('DeleteCompanyHandler', () => {
  let handler: DeleteCompanyHandler;
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

    handler = new DeleteCompanyHandler(companyRepository);
  });

  it('throws CompanyNotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteCompanyCommand('owner-1', 'company-1')),
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
      handler.execute(new DeleteCompanyCommand('someone-else', 'company-1')),
    ).rejects.toThrow(CompanyOwnershipException);
    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  it('soft-deletes the company and persists it', async () => {
    const company = new Company({
      id: 'company-1',
      name: 'Acme',
      slug: 'acme',
      ownerId: 'owner-1',
    });
    companyRepository.findById.mockResolvedValue(company);
    companyRepository.update.mockImplementation(async (c) => c);

    await handler.execute(new DeleteCompanyCommand('owner-1', 'company-1'));

    expect(companyRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });
});
