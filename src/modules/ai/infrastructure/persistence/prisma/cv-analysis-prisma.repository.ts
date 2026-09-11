import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CandidateSearchFilters } from '@/modules/ai/domain/repositories/cv-analysis.repository';

/**
 * Low-level Prisma data access for CvAnalysis, plus the candidate-search
 * read model (User -> Profile -> Cv -> CvAnalysis). That join spans three
 * other modules' tables directly rather than through their repositories —
 * same rationale as CvPrismaRepository.hasRecruiterAccess querying
 * jobApplication directly: a dedicated cross-module port for a single
 * read-model query would just add indirection without avoiding any import
 * cycle (this module already can't be imported back by cv/user/job).
 */
@Injectable()
export class CvAnalysisPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCvId(cvId: string) {
    return this.prisma.cvAnalysis.findUnique({ where: { cvId } });
  }

  /**
   * Narrow, direct read of the `cv` table (fileKey/mimeType/fileType only)
   * rather than a full ICvRepository cross-module dependency — same
   * "avoid a needless module import for 3 scalar fields" reasoning as
   * CvPrismaRepository.hasRecruiterAccess reading jobApplication directly.
   */
  async findCvFileInfo(cvId: string) {
    return this.prisma.cv.findFirst({
      where: { id: cvId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        fileKey: true,
        mimeType: true,
        fileType: true,
      },
    });
  }

  async upsert(data: Prisma.CvAnalysisUncheckedCreateInput) {
    return this.prisma.cvAnalysis.upsert({
      where: { cvId: data.cvId },
      create: data,
      update: data,
    });
  }

  async findPendingCvIds(limit: number): Promise<string[]> {
    const cvs = await this.prisma.cv.findMany({
      where: {
        deletedAt: null,
        OR: [
          { cvAnalysis: null },
          { cvAnalysis: { status: { in: ['PENDING', 'FAILED'] } } },
        ],
      },
      select: { id: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
    return cvs.map((cv) => cv.id);
  }

  /**
   * Deterministic filtering step. Only ever matches CVs with a COMPLETED
   * analysis — a CV becomes searchable a short while after upload (once the
   * `cv.uploaded` listener or the analyze-pending-cvs cron catches up), not
   * synchronously with the request.
   */
  async searchCandidatePool(filters: CandidateSearchFilters) {
    const analysisFilter: Prisma.CvAnalysisWhereInput = {
      status: 'COMPLETED',
      ...(filters.skills.length > 0
        ? { skills: { hasSome: filters.skills } }
        : {}),
      ...(filters.minExperienceYears != null
        ? { experienceYears: { gte: filters.minExperienceYears } }
        : {}),
    };

    const users = await this.prisma.user.findMany({
      where: {
        roleRef: { name: 'CANDIDATE' },
        status: 'ACTIVE',
        cvs: {
          some: {
            deletedAt: null,
            status: 'PUBLISHED',
            cvAnalysis: analysisFilter,
          },
        },
      },
      take: filters.limit,
      include: {
        profile: true,
        cvs: {
          where: {
            deletedAt: null,
            status: 'PUBLISHED',
            cvAnalysis: analysisFilter,
          },
          include: { cvAnalysis: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    return users;
  }

  async findCandidateByUserId(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, roleRef: { name: 'CANDIDATE' } },
      include: {
        profile: true,
        cvs: {
          where: {
            deletedAt: null,
            status: 'PUBLISHED',
            cvAnalysis: { status: 'COMPLETED' },
          },
          include: { cvAnalysis: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
