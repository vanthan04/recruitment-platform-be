import {
  CreateSavedSearchCommand,
  CreateSavedSearchHandler,
} from '@/modules/job-alert/application/commands/create-saved-search.command';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { ICategoryLookupPort } from '@/modules/job-alert/application/ports/category-lookup.port';
import { SavedSearchCategoryNotFoundException } from '@/modules/job-alert/domain/exceptions/job-alert.exceptions';

describe('CreateSavedSearchHandler', () => {
  let handler: CreateSavedSearchHandler;
  let savedSearchRepository: jest.Mocked<ISavedSearchRepository>;
  let categoryLookupPort: jest.Mocked<ICategoryLookupPort>;

  beforeEach(() => {
    savedSearchRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    categoryLookupPort = { exists: jest.fn() };

    handler = new CreateSavedSearchHandler(
      savedSearchRepository,
      categoryLookupPort,
    );
  });

  it('throws SavedSearchCategoryNotFoundException when the category does not exist', async () => {
    categoryLookupPort.exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new CreateSavedSearchCommand('user-1', { categoryId: 'cat-1' }),
      ),
    ).rejects.toThrow(SavedSearchCategoryNotFoundException);
    expect(savedSearchRepository.save).not.toHaveBeenCalled();
  });

  it('skips the category check when no categoryId is given', async () => {
    savedSearchRepository.save.mockImplementation(async (s) => s);

    await handler.execute(
      new CreateSavedSearchCommand('user-1', { keyword: 'backend' }),
    );

    expect(categoryLookupPort.exists).not.toHaveBeenCalled();
    expect(savedSearchRepository.save).toHaveBeenCalled();
  });

  it('saves a saved search with nullable fields defaulted', async () => {
    categoryLookupPort.exists.mockResolvedValue(true);
    savedSearchRepository.save.mockImplementation(async (s) => s);

    const result = await handler.execute(
      new CreateSavedSearchCommand('user-1', { categoryId: 'cat-1' }),
    );

    expect(savedSearchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        categoryId: 'cat-1',
        keyword: null,
        location: null,
        employmentType: null,
        workMode: null,
      }),
    );
    expect(result).toBeDefined();
  });
});
