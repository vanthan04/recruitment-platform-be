import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkPrismaRepository } from '@/modules/bookmark/infrastructure/persistence/prisma/bookmark-prisma.repository';
export declare class BookmarkInfraRepository implements IBookmarkRepository {
    private readonly bookmarkPrisma;
    constructor(bookmarkPrisma: BookmarkPrismaRepository);
    findByUserIdAndJobId(userId: string, jobId: string): Promise<Bookmark | null>;
    findAllByUserId(userId: string): Promise<Bookmark[]>;
    save(bookmark: Bookmark): Promise<Bookmark>;
    delete(userId: string, jobId: string): Promise<void>;
}
