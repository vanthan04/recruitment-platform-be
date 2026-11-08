import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class JobRecommendationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Skills of the candidate's published, not-deleted CVs whose analysis completed. */
  async findAnalyzedCvSkills(userId: string) {
    return this.prisma.cvAnalysis.findMany({
      where: {
        status: 'COMPLETED',
        cv: { userId, deletedAt: null, status: 'PUBLISHED' },
      },
      select: { skills: true },
    });
  }

  async findOpenJobsNotAppliedBy(userId: string, limit: number) {
    return this.prisma.job.findMany({
      where: {
        // Same "can still be applied to" rule as the public job search
        // (JobInfraRepository.findAllPaginated): an expired job is only
        // closed by the hourly cron, so the date is checked here too.
        status: 'OPEN',
        deletedAt: null,
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
        skills: { some: {} },
        applications: { none: { userId } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        location: true,
        employmentType: true,
        workMode: true,
        level: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        expiresAt: true,
        createdAt: true,
        company: { select: { id: true, name: true, logoUrl: true } },
        skills: { select: { skill: { select: { name: true } } } },
      },
    });
  }
}
