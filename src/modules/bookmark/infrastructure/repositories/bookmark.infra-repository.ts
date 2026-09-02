import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkPrismaRepository } from '@/modules/bookmark/infrastructure/persistence/prisma/bookmark-prisma.repository';
import { BookmarkMapper } from '@/modules/bookmark/infrastructure/persistence/mappers/bookmark.mapper';

@Injectable()
export class BookmarkInfraRepository implements IBookmarkRepository {
  constructor(private readonly bookmarkPrisma: BookmarkPrismaRepository) {}

  async findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<Bookmark | null> {
    const raw = await this.bookmarkPrisma.findByUserIdAndJobId(userId, jobId);
    return BookmarkMapper.toDomain(raw);
  }

  async findAllByUserId(userId: string): Promise<Bookmark[]> {
    const raws = await this.bookmarkPrisma.findAllByUserId(userId);
    return raws.map((r) => BookmarkMapper.toDomain(r)!);
  }

  async save(bookmark: Bookmark): Promise<Bookmark> {
    const data = BookmarkMapper.toPersistence(bookmark);
    const raw = await this.bookmarkPrisma.create(data);
    return BookmarkMapper.toDomain(raw)!;
  }

  async delete(userId: string, jobId: string): Promise<void> {
    await this.bookmarkPrisma.delete(userId, jobId);
  }
}
