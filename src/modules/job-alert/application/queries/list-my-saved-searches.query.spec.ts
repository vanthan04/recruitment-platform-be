import {
  ListMySavedSearchesQuery,
  ListMySavedSearchesHandler,
} from '@/modules/job-alert/application/queries/list-my-saved-searches.query';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';

describe('ListMySavedSearchesHandler', () => {
  let handler: ListMySavedSearchesHandler;
  let savedSearchRepository: jest.Mocked<ISavedSearchRepository>;

  beforeEach(() => {
    savedSearchRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      countByUserId: jest.fn(),
      findBatch: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    handler = new ListMySavedSearchesHandler(savedSearchRepository);
  });

  it('returns the DTOs for the given user only, with pagination metadata', async () => {
    savedSearchRepository.findAllByUserId.mockResolvedValue({
      savedSearches: [
        new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
      ],
      total: 1,
    });

    const result = await handler.execute(
      new ListMySavedSearchesQuery('user-1'),
    );

    expect(savedSearchRepository.findAllByUserId).toHaveBeenCalledWith(
      'user-1',
      {
        skip: 0,
        take: 20,
      },
    );
    expect(result.savedSearches).toHaveLength(1);
    expect(result.savedSearches[0].keyword).toBe('backend');
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('requests the correct skip/take for a given page/limit', async () => {
    savedSearchRepository.findAllByUserId.mockResolvedValue({
      savedSearches: [],
      total: 0,
    });

    await handler.execute(new ListMySavedSearchesQuery('user-1', 2, 10));

    expect(savedSearchRepository.findAllByUserId).toHaveBeenCalledWith(
      'user-1',
      {
        skip: 10,
        take: 10,
      },
    );
  });
});
