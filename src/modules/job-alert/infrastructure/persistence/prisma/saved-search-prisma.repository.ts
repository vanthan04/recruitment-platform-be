import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class SavedSearchPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.savedSearch.findUnique({ where: { id } });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.savedSearch.findMany();
  }

  async create(data: any) {
    return this.prisma.savedSearch.create({ data });
  }

  async delete(id: string) {
    return this.prisma.savedSearch.delete({ where: { id } });
  }
}
