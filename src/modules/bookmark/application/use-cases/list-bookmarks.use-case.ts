import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkResponseMapper } from '@/modules/bookmark/application/mappers/bookmark-response.mapper';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';

@Injectable()
export class ListBookmarksUseCase {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(userId: string): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.bookmarkRepository.findAllByUserId(userId);
    return BookmarkResponseMapper.toDtoList(bookmarks);
  }
}
