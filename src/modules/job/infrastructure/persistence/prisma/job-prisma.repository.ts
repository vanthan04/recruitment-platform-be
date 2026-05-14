import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAllByRecruiter(recruiterId: string) {
    return this.prisma.job.findMany({
      where: { postedById: recruiterId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
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
}
