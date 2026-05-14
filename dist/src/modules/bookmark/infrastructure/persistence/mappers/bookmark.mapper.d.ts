import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
export declare class BookmarkMapper {
    static toDomain(raw: any): Bookmark | null;
    static toPersistence(bookmark: Bookmark): any;
}
