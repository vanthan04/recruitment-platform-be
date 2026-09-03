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
      save: jest.fn(),
      delete: jest.fn(),
    };

    handler = new ListMySavedSearchesHandler(savedSearchRepository);
  });

  it('returns the DTOs for the given user only', async () => {
    savedSearchRepository.findAllByUserId.mockResolvedValue([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);

    const result = await handler.execute(
      new ListMySavedSearchesQuery('user-1'),
    );

    expect(savedSearchRepository.findAllByUserId).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe('backend');
  });
});
