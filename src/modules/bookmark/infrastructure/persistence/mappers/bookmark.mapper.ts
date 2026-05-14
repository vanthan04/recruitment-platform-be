import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

export class BookmarkMapper {
  static toDomain(raw: any): Bookmark | null {
    if (!raw) return null;

    return new Bookmark({
      id: raw.id,
      userId: raw.userId,
      jobId: raw.jobId,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(bookmark: Bookmark): any {
    return {
      userId: bookmark.userId,
      jobId: bookmark.jobId,
    };
  }
}
