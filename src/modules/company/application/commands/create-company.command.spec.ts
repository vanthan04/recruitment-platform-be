import { Prisma } from '@prisma/client';
import {
  CreateCompanyCommand,
  CreateCompanyHandler,
} from '@/modules/company/application/commands/create-company.command';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import {
  CompanyAlreadyExistsException,
  CompanySlugTakenException,
  InvalidLogoUrlException,
} from '@/modules/company/domain/exceptions/company.exceptions';
import { Company } from '@/modules/company/domain/entities/company.entity';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

describe('CreateCompanyHandler', () => {
  let handler: CreateCompanyHandler;
  let companyRepository: jest.Mocked<ICompanyRepository>;
  let fileStorage: jest.Mocked<IFileStorageProvider>;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      findBySlug: jest.fn(),
      findByOwnerId: jest.fn(),
      existsBySlug: jest.fn(),
      findAllPaginated: jest.fn(),
      save: jest.fn(),
      saveWithOwnerLink: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    fileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
      uploadBuffer: jest.fn(),
      deleteByKey: jest.fn(),
      getSignedUrl: jest.fn(),
      downloadBuffer: jest.fn(),
      isOwnedUrl: jest.fn().mockReturnValue(true),
    };

    handler = new CreateCompanyHandler(companyRepository, fileStorage);
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
    expect(companyRepository.saveWithOwnerLink).not.toHaveBeenCalled();
  });

  it('atomically creates the company + owner link, and returns the DTO', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockResolvedValue(false);
    companyRepository.saveWithOwnerLink.mockImplementation(async (c) => {
      c.id = 'company-1';
      return c;
    });

    const result = await handler.execute(
      new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
    );

    expect(result.slug).toBe('acme-inc');
    expect(companyRepository.saveWithOwnerLink).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Inc', ownerId: 'owner-1' }),
    );
    expect(companyRepository.save).not.toHaveBeenCalled();
  });

  it('appends a numeric suffix when the slug is already taken', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockImplementation(
      async (slug) => slug === 'acme-inc',
    );
    companyRepository.saveWithOwnerLink.mockImplementation(async (c) => {
      c.id = 'company-1';
      return c;
    });

    const result = await handler.execute(
      new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
    );

    expect(result.slug).toBe('acme-inc-2');
  });

  it('translates a P2002 race (two concurrent creates past the existence checks) into CompanyAlreadyExistsException', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockResolvedValue(false);
    companyRepository.saveWithOwnerLink.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['ownerId'] },
      }),
    );

    await expect(
      handler.execute(
        new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
      ),
    ).rejects.toThrow(CompanyAlreadyExistsException);
  });

  it('translates a P2002 slug collision into CompanySlugTakenException, not CompanyAlreadyExistsException', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockResolvedValue(false);
    companyRepository.saveWithOwnerLink.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        // The real shape this app's P2002 errors have — see
        // prisma-error.util.ts's doc comment (@prisma/adapter-pg, verified
        // empirically, not the classic query-engine `target` array shape).
        meta: {
          driverAdapterError: {
            cause: { constraint: { index: 'companies_slug_key' } },
          },
        },
      }),
    );

    await expect(
      handler.execute(
        new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
      ),
    ).rejects.toThrow(CompanySlugTakenException);
  });

  it('rethrows a non-P2002 error from saveWithOwnerLink untouched', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    companyRepository.existsBySlug.mockResolvedValue(false);
    companyRepository.saveWithOwnerLink.mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      handler.execute(
        new CreateCompanyCommand('owner-1', { name: 'Acme Inc' }),
      ),
    ).rejects.toThrow('DB is down');
  });

  it('rejects a logoUrl that is not one of our own upload URLs', async () => {
    companyRepository.findByOwnerId.mockResolvedValue(null);
    fileStorage.isOwnedUrl.mockReturnValue(false);

    await expect(
      handler.execute(
        new CreateCompanyCommand('owner-1', {
          name: 'Acme Inc',
          logoUrl: 'https://attacker.example/track.png',
        }),
      ),
    ).rejects.toThrow(InvalidLogoUrlException);
    expect(companyRepository.saveWithOwnerLink).not.toHaveBeenCalled();
  });
});
