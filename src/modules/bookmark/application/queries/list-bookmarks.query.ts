import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkResponseMapper } from '@/modules/bookmark/application/mappers/bookmark-response.mapper';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';

export class ListBookmarksQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(ListBookmarksQuery)
export class ListBookmarksHandler implements IQueryHandler<ListBookmarksQuery, BookmarkResponseDto[]> {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute({ userId }: ListBookmarksQuery): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.bookmarkRepository.findAllByUserId(userId);
    return BookmarkResponseMapper.toDtoList(bookmarks);
  }
}
