import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class JobApplicationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
    });
  }

  async findByUserIdAndJobId(userId: string, jobId: string) {
    return this.prisma.jobApplication.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
    });
  }

  async findAllByJobId(jobId: string, params: { skip: number; take: number }) {
    // No `include` here on purpose — JobApplicationMapper.toDomain only ever
    // reads the JobApplication's own scalar columns. Candidate/CV summaries
    // for the recruiter view are fetched separately via ports
    // (IApplicationUserLookupPort etc.), not a cross-module Prisma join.
    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { jobId },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.jobApplication.count({ where: { jobId } }),
    ]);
    return { applications, total };
  }

  async findAllByUserId(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.jobApplication.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.jobApplication.update({
      where: { id },
      data,
    });
  }

  async countByJobIdGroupedByStatus(jobId: string) {
    return this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobId },
      _count: { _all: true },
    });
  }
}
