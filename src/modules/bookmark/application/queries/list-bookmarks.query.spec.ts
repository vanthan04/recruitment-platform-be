import {
  ListBookmarksQuery,
  ListBookmarksHandler,
} from '@/modules/bookmark/application/queries/list-bookmarks.query';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

describe('ListBookmarksHandler', () => {
  let handler: ListBookmarksHandler;
  let bookmarkRepository: jest.Mocked<IBookmarkRepository>;

  beforeEach(() => {
    bookmarkRepository = {
      findByUserIdAndJobId: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    handler = new ListBookmarksHandler(bookmarkRepository);
  });

  it('returns an empty list when the user has no bookmarks', async () => {
    bookmarkRepository.findAllByUserId.mockResolvedValue([]);

    const result = await handler.execute(new ListBookmarksQuery('user-1'));

    expect(result).toEqual([]);
    expect(bookmarkRepository.findAllByUserId).toHaveBeenCalledWith('user-1');
  });

  it('maps bookmark entities to response DTOs', async () => {
    const bookmark = new Bookmark({
      id: 'bm-1',
      userId: 'user-1',
      jobId: 'job-1',
    });
    bookmark.createdAt = new Date('2026-01-01T00:00:00Z');
    bookmarkRepository.findAllByUserId.mockResolvedValue([bookmark]);

    const result = await handler.execute(new ListBookmarksQuery('user-1'));

    expect(result).toEqual([
      {
        id: 'bm-1',
        userId: 'user-1',
        jobId: 'job-1',
        createdAt: bookmark.createdAt,
      },
    ]);
  });
});
