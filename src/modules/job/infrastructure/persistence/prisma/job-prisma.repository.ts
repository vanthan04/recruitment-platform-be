import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly companySelect = {
    select: { id: true, name: true, logoUrl: true },
  };

  private readonly categorySelect = {
    select: { id: true, name: true, slug: true },
  };

  private readonly relationIncludes = {
    company: this.companySelect,
    category: this.categorySelect,
  };

  async findById(id: string) {
    return this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: this.relationIncludes,
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
        include: this.relationIncludes,
      }),
      this.prisma.job.count({ where: params.where }),
    ]);

    return { jobs, total };
  }

  async findAllByRecruiter(recruiterId: string) {
    return this.prisma.job.findMany({
      where: { postedById: recruiterId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: this.relationIncludes,
    });
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
    return this.prisma.job.create({ data, include: this.relationIncludes });
  }

  async update(id: string, data: any) {
    return this.prisma.job.update({
      where: { id },
      data,
      include: this.relationIncludes,
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
