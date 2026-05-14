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
    return this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.bookmark.create({ data });
  }

  async delete(userId: string, jobId: string) {
    return this.prisma.bookmark.delete({
      where: {
        userId_jobId: { userId, jobId },
      },
    });
  }
}
