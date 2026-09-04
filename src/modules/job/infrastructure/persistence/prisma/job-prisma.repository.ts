import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  // No `include` here — this repository only ever touches the `jobs` table.
  // Company/category/skill summaries are attached in JobInfraRepository via
  // lookup ports, not a Prisma relational join.

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

  /** The job_skills join rows for a batch of jobs — just the ids, not the Skill rows. */
  async findSkillIdsByJobIds(jobIds: string[]) {
    return this.prisma.jobSkill.findMany({
      where: { jobId: { in: jobIds } },
      select: { jobId: true, skillId: true },
    });
  }

  /** Full-replace a job's skill assignments. */
  async setSkills(jobId: string, skillIds: string[]) {
    const uniqueIds = [...new Set(skillIds)];
    await this.prisma.$transaction([
      this.prisma.jobSkill.deleteMany({ where: { jobId } }),
      ...(uniqueIds.length > 0
        ? [
            this.prisma.jobSkill.createMany({
              data: uniqueIds.map((skillId) => ({ jobId, skillId })),
            }),
          ]
        : []),
    ]);
  }
}
