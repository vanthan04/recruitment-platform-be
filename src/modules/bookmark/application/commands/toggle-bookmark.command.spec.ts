import {
  ToggleBookmarkCommand,
  ToggleBookmarkHandler,
} from '@/modules/bookmark/application/commands/toggle-bookmark.command';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { IJobLookupPort } from '@/modules/bookmark/application/ports/job-lookup.port';
import { BookmarkedJobNotFoundException } from '@/modules/bookmark/domain/exceptions/bookmark.exceptions';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

describe('ToggleBookmarkHandler', () => {
  let handler: ToggleBookmarkHandler;
  let bookmarkRepository: jest.Mocked<IBookmarkRepository>;
  let jobLookup: jest.Mocked<IJobLookupPort>;

  beforeEach(() => {
    bookmarkRepository = {
      findByUserIdAndJobId: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    jobLookup = { exists: jest.fn() };

    handler = new ToggleBookmarkHandler(bookmarkRepository, jobLookup);
  });

  it('throws BookmarkedJobNotFoundException when the job does not exist', async () => {
    jobLookup.exists.mockResolvedValue(false);

    await expect(
      handler.execute(new ToggleBookmarkCommand('user-1', 'job-1')),
    ).rejects.toThrow(BookmarkedJobNotFoundException);

    expect(bookmarkRepository.findByUserIdAndJobId).not.toHaveBeenCalled();
  });

  it('deletes the bookmark and returns bookmarked:false when one already exists', async () => {
    jobLookup.exists.mockResolvedValue(true);
    bookmarkRepository.findByUserIdAndJobId.mockResolvedValue(
      new Bookmark({ userId: 'user-1', jobId: 'job-1' }),
    );

    const result = await handler.execute(
      new ToggleBookmarkCommand('user-1', 'job-1'),
    );

    expect(result).toEqual({ bookmarked: false });
    expect(bookmarkRepository.delete).toHaveBeenCalledWith('user-1', 'job-1');
    expect(bookmarkRepository.save).not.toHaveBeenCalled();
  });

  it('saves a new bookmark and returns bookmarked:true when none exists', async () => {
    jobLookup.exists.mockResolvedValue(true);
    bookmarkRepository.findByUserIdAndJobId.mockResolvedValue(null);
    bookmarkRepository.save.mockImplementation(async (b) => b);

    const result = await handler.execute(
      new ToggleBookmarkCommand('user-1', 'job-1'),
    );

    expect(result).toEqual({ bookmarked: true });
    expect(bookmarkRepository.delete).not.toHaveBeenCalled();
    expect(bookmarkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', jobId: 'job-1' }),
    );
  });
});
