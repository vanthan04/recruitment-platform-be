import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { Bookmark as PrismaBookmark, Prisma } from '@prisma/client';

export class BookmarkMapper {
  static toDomain(raw: PrismaBookmark | null): Bookmark | null {
    if (!raw) return null;

    return new Bookmark({
      id: raw.id,
      userId: raw.userId,
      jobId: raw.jobId,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(
    bookmark: Bookmark,
  ): Prisma.BookmarkUncheckedCreateInput {
    return {
      userId: bookmark.userId,
      jobId: bookmark.jobId,
    };
  }
}
