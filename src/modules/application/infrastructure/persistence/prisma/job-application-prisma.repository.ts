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
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: { include: { profile: true } },
        cv: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: true,
      },
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
