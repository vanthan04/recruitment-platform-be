import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.jobApplication.findMany({
      where: { id: { in: ids } },
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

  async findAllByUserId(
    userId: string,
    params: { skip: number; take: number },
  ) {
    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.jobApplication.count({ where: { userId } }),
    ]);
    return { applications, total };
  }

  async create(data: Prisma.JobApplicationUncheckedCreateInput) {
    return this.prisma.jobApplication.create({ data });
  }

  async update(id: string, data: Prisma.JobApplicationUncheckedUpdateInput) {
    return this.prisma.jobApplication.update({
      where: { id },
      data,
    });
  }

  /**
   * Status update + its audit-history row in one transaction — without this,
   * a failure between the two writes leaves the application's status
   * changed with no corresponding history entry explaining when/why.
   */
  async updateWithHistory(
    id: string,
    data: Prisma.JobApplicationUncheckedUpdateInput,
    historyData: Prisma.ApplicationStatusHistoryUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.jobApplication.update({
        where: { id },
        data,
      });
      await tx.applicationStatusHistory.create({ data: historyData });
      return application;
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
