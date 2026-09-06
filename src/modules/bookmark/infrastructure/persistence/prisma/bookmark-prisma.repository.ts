import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class BookmarkPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserIdAndJobId(userId: string, jobId: string) {
    return this.prisma.bookmark.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
    });
  }

  async findAllByUserId(userId: string) {
    // No `include: { job: true }` — BookmarkMapper.toDomain only reads the
    // bookmark's own scalar columns; job details are resolved separately by
    // callers that need them (e.g. FE's getMyBookmarkedJobs), so eager-loading
    // the full job row here was pure waste on every request.
    return this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.bookmark.create({ data });
  }

  async delete(userId: string, jobId: string) {
    // deleteMany (not delete) — idempotent under a concurrent double-toggle:
    // two near-simultaneous "un-bookmark" calls can both pass the
    // application-level existence check before either delete completes, and
    // `delete()` throws P2025 on the row the loser no longer finds.
    // `deleteMany` just reports zero rows affected instead.
    await this.prisma.bookmark.deleteMany({
      where: { userId, jobId },
    });
  }
}
