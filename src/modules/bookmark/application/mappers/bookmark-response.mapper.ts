import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';

export class BookmarkResponseMapper {
  static toDto(bookmark: Bookmark): BookmarkResponseDto {
    const dto = new BookmarkResponseDto();
    dto.id = bookmark.id;
    dto.userId = bookmark.userId;
    dto.jobId = bookmark.jobId;
    dto.createdAt = bookmark.createdAt;
    return dto;
  }

  static toDtoList(bookmarks: Bookmark[]): BookmarkResponseDto[] {
    return bookmarks.map(BookmarkResponseMapper.toDto);
  }
}
