import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PermissionPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  findManyByIds(ids: string[]) {
    return this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  findByName(name: string) {
    return this.prisma.permission.findUnique({
      where: { name },
      select: { id: true },
    });
  }
}
