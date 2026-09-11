import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavedSearchPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.savedSearch.findUnique({ where: { id } });
  }

  async findAllByUserId(
    userId: string,
    params: { skip: number; take: number },
  ) {
    const [savedSearches, total] = await Promise.all([
      this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.savedSearch.count({ where: { userId } }),
    ]);
    return { savedSearches, total };
  }

  async countByUserId(userId: string) {
    return this.prisma.savedSearch.count({ where: { userId } });
  }

  async findAll() {
    return this.prisma.savedSearch.findMany();
  }

  async findBatch(params: { cursor?: string; take: number }) {
    return this.prisma.savedSearch.findMany({
      take: params.take,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy: { id: 'asc' },
    });
  }

  async create(data: Prisma.SavedSearchUncheckedCreateInput) {
    return this.prisma.savedSearch.create({ data });
  }

  async delete(id: string) {
    return this.prisma.savedSearch.delete({ where: { id } });
  }
}
