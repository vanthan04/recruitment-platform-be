import {
  CreateCompanyCommand,
  CreateCompanyHandler,
} from '@/modules/company/application/commands/create-company.command';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { IUserCompanyLinkPort } from '@/modules/company/application/ports/user-company-link.port';
import { CompanyAlreadyExistsException } from '@/modules/company/domain/exceptions/company.exceptions';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('CreateCompanyHandler', () => {
  let handler: CreateCompanyHandler;
  let companyRepository: jest.Mocked<ICompanyRepository>;
  let userCompanyLinkPort: jest.Mocked<IUserCompanyLinkPort>;

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
    userCompanyLinkPort = { updateCompanyId: jest.fn() };

    handler = new CreateCompanyHandler(companyRepository, userCompanyLinkPort);
  });

  it('throws CompanyAlreadyExistsException when the owner already has a company', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(
      new Company({ name: 'Existing', slug: 'existing', ownerId: 'owner-1' }),
    );

    await expect(
      handler.execute(
        new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
      ),
    ).rejects.toThrow(CompanyAlreadyExistsException);
    expect(companyRepository.save).not.toHaveBeenCalled();
  });

  it('creates the company, links it to the owner, and returns the DTO', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockResolvedValue(false);
    companyRepository.save.mockImplementation(async (c) => ({
      ...c,
      id: 'company-1',
    }));

    const result = await handler.execute(
      new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
    );

    expect(result.slug).toBe('acme-inc');
    expect(companyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Inc', ownerId: 'owner-1' }),
    );
    expect(userCompanyLinkPort.updateCompanyId).toHaveBeenCalledWith(
      'owner-1',
      'company-1',
    );
  });

  it('appends a numeric suffix when the slug is already taken', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockImplementation(
      async (slug) => slug === 'acme-inc',
    );
    companyRepository.save.mockImplementation(async (c) => ({
      ...c,
      id: 'company-1',
    }));

    const result = await handler.execute(
      new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
    );

    expect(result.slug).toBe('acme-inc-2');
  });
});
