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
    bookmarkRepository.findAllByUserId.mockResolvedValue({
      bookmarks: [],
      total: 0,
    });

    const result = await handler.execute(new ListBookmarksQuery('user-1'));

    expect(result.bookmarks).toEqual([]);
    expect(result.total).toBe(0);
    expect(bookmarkRepository.findAllByUserId).toHaveBeenCalledWith('user-1', {
      skip: 0,
      take: 20,
    });
  });

  it('maps bookmark entities to response DTOs and carries pagination metadata', async () => {
    const bookmark = new Bookmark({
      id: 'bm-1',
      userId: 'user-1',
      jobId: 'job-1',
    });
    bookmark.createdAt = new Date('2026-01-01T00:00:00Z');
    bookmarkRepository.findAllByUserId.mockResolvedValue({
      bookmarks: [bookmark],
      total: 1,
    });

    const result = await handler.execute(
      new ListBookmarksQuery('user-1', 2, 10),
    );

    expect(bookmarkRepository.findAllByUserId).toHaveBeenCalledWith('user-1', {
      skip: 10,
      take: 10,
    });
    expect(result.bookmarks).toEqual([
      {
        id: 'bm-1',
        userId: 'user-1',
        jobId: 'job-1',
        createdAt: bookmark.createdAt,
      },
    ]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});
