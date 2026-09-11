import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkResponseMapper } from '@/modules/bookmark/application/mappers/bookmark-response.mapper';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';
import { normalizePagination } from '@/common/utils/pagination.util';

export interface ListBookmarksResult {
  bookmarks: BookmarkResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ListBookmarksQuery extends Query<ListBookmarksResult> {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(ListBookmarksQuery)
export class ListBookmarksHandler implements IQueryHandler<
  ListBookmarksQuery,
  ListBookmarksResult
> {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute({
    userId,
    page,
    limit,
  }: ListBookmarksQuery): Promise<ListBookmarksResult> {
    const normalized = normalizePagination({ page, limit });
    const { bookmarks, total } = await this.bookmarkRepository.findAllByUserId(
      userId,
      { skip: normalized.skip, take: normalized.limit },
    );

    return {
      bookmarks: BookmarkResponseMapper.toDtoList(bookmarks),
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
