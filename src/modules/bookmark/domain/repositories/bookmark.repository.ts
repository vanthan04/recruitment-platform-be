import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

export abstract class IBookmarkRepository {
  abstract findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<Bookmark | null>;
  abstract findAllByUserId(userId: string): Promise<Bookmark[]>;
  abstract save(bookmark: Bookmark): Promise<Bookmark>;
  abstract delete(userId: string, jobId: string): Promise<void>;
}
