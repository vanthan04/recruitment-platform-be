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

  async findAllByJobId(jobId: string) {
    // No `include` here on purpose — JobApplicationMapper.toDomain only ever
    // reads the JobApplication's own scalar columns. Candidate/CV summaries
    // for the recruiter view are fetched separately via ports
    // (IApplicationUserLookupPort etc.), not a cross-module Prisma join.
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
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
