import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  // No `include` here — this repository only ever touches the `jobs` table.
  // Company/category summaries are attached in JobInfraRepository via
  // ICompanyLookupPort/ICategoryLookupPort, not a Prisma relational join.

  async findById(id: string) {
    return this.prisma.job.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAllPaginated(params: {
    skip: number;
    take: number;
    where: Prisma.JobWhereInput;
    orderBy?: Prisma.JobOrderByWithRelationInput;
  }) {
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy || { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where: params.where }),
    ]);

    return { jobs, total };
  }

  async findExpiredOpen() {
    return this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        deletedAt: null,
        expiresAt: { lt: new Date() },
      },
    });
  }

  async create(data: any) {
    return this.prisma.job.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.job.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.job.delete({ where: { id } });
  }

  async incrementViewCount(id: string) {
    await this.prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
