import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';
export declare class BookmarkResponseMapper {
    static toDto(bookmark: Bookmark): BookmarkResponseDto;
    static toDtoList(bookmarks: Bookmark[]): BookmarkResponseDto[];
}
