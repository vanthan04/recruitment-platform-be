import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Bookmark as PrismaBookmark, Prisma } from '@prisma/client';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

/**
 * Single Prisma-backed implementation of IBookmarkRepository — same
 * simplification as CategoryPrismaRepository/SkillPrismaRepository: a
 * toggle-style join table has no swappable-persistence requirement to
 * justify a separate infra-repository/prisma-repository/mapper split.
 */
@Injectable()
export class BookmarkPrismaRepository implements IBookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<Bookmark | null> {
    const raw = await this.prisma.bookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    return toDomain(raw);
  }

  async findAllByUserId(
    userId: string,
    params: { skip: number; take: number },
  ): Promise<{ bookmarks: Bookmark[]; total: number }> {
    // No `include: { job: true }` — job details are resolved separately by
    // callers that need them (e.g. FE's getMyBookmarkedJobs), so
    // eager-loading the full job row here was pure waste on every request.
    const [raws, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);
    return { bookmarks: raws.map((r) => toDomain(r)!), total };
  }

  async save(bookmark: Bookmark): Promise<Bookmark> {
    const raw = await this.prisma.bookmark.create({
      data: toPersistence(bookmark),
    });
    return toDomain(raw)!;
  }

  async delete(userId: string, jobId: string): Promise<void> {
    // deleteMany (not delete) — idempotent under a concurrent double-toggle:
    // two near-simultaneous "un-bookmark" calls can both pass the
    // application-level existence check before either delete completes, and
    // `delete()` throws P2025 on the row the loser no longer finds.
    // `deleteMany` just reports zero rows affected instead.
    await this.prisma.bookmark.deleteMany({ where: { userId, jobId } });
  }
}

function toDomain(raw: PrismaBookmark | null): Bookmark | null {
  if (!raw) return null;
  return new Bookmark({
    id: raw.id,
    userId: raw.userId,
    jobId: raw.jobId,
    createdAt: raw.createdAt,
  });
}

function toPersistence(
  bookmark: Bookmark,
): Prisma.BookmarkUncheckedCreateInput {
  return {
    userId: bookmark.userId,
    jobId: bookmark.jobId,
  };
}
