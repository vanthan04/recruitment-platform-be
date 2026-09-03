import {
  DeleteSavedSearchCommand,
  DeleteSavedSearchHandler,
} from '@/modules/job-alert/application/commands/delete-saved-search.command';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import {
  SavedSearchNotFoundException,
  SavedSearchOwnershipException,
} from '@/modules/job-alert/domain/exceptions/job-alert.exceptions';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';

describe('DeleteSavedSearchHandler', () => {
  let handler: DeleteSavedSearchHandler;
  let savedSearchRepository: jest.Mocked<ISavedSearchRepository>;

  beforeEach(() => {
    savedSearchRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    handler = new DeleteSavedSearchHandler(savedSearchRepository);
  });

  it('throws SavedSearchNotFoundException when it does not exist', async () => {
    savedSearchRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteSavedSearchCommand('user-1', 'ss-1')),
    ).rejects.toThrow(SavedSearchNotFoundException);
  });

  it('throws SavedSearchOwnershipException when the caller does not own it', async () => {
    savedSearchRepository.findById.mockResolvedValue(
      new SavedSearch({ id: 'ss-1', userId: 'someone-else' }),
    );

    await expect(
      handler.execute(new DeleteSavedSearchCommand('user-1', 'ss-1')),
    ).rejects.toThrow(SavedSearchOwnershipException);
    expect(savedSearchRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the saved search when owned by the caller', async () => {
    savedSearchRepository.findById.mockResolvedValue(
      new SavedSearch({ id: 'ss-1', userId: 'user-1' }),
    );

    await handler.execute(new DeleteSavedSearchCommand('user-1', 'ss-1'));

    expect(savedSearchRepository.delete).toHaveBeenCalledWith('ss-1');
  });
});
