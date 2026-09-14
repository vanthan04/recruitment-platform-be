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
   * Same lookup as findByCvId, additionally scoped to `jobId` — the CV's
   * owner must have an application for that job, or this returns null even
   * if the CV/analysis exists. Backs get_cv_analysis: AI tools must never
   * be able to pull up an arbitrary candidate's analysis outside the
   * recruiter's own applicant pool for the job in scope.
   */
  async findByCvIdForJob(cvId: string, jobId: string) {
    return this.prisma.cvAnalysis.findFirst({
      where: { cvId, cv: { user: { applications: { some: { jobId } } } } },
    });
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

  /**
   * See ICvAnalysisRepository.claimPendingCvIds's doc comment for why this
   * both selects AND marks `processingStartedAt` in the same call, not just
   * a read. Two disjoint groups get claimed differently: a CV with no
   * CvAnalysis row yet needs one created (status defaults to PENDING); a
   * CV with a stale/unclaimed PENDING or FAILED row just needs its claim
   * timestamp bumped. Both happen inside one transaction so a claim is
   * all-or-nothing for the whole batch.
   */
  async claimPendingCvIds(
    limit: number,
    staleAfterMs: number,
  ): Promise<string[]> {
    const staleThreshold = new Date(Date.now() - staleAfterMs);

    const candidates = await this.prisma.cv.findMany({
      where: {
        deletedAt: null,
        OR: [
          { cvAnalysis: null },
          {
            cvAnalysis: {
              status: { in: ['PENDING', 'FAILED'] },
              OR: [
                { processingStartedAt: null },
                { processingStartedAt: { lt: staleThreshold } },
              ],
            },
          },
        ],
      },
      select: { id: true, cvAnalysis: { select: { cvId: true } } },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
    if (candidates.length === 0) return [];

    const now = new Date();
    const toCreate = candidates.filter((c) => !c.cvAnalysis).map((c) => c.id);
    const toClaim = candidates.filter((c) => c.cvAnalysis).map((c) => c.id);

    await this.prisma.$transaction([
      ...toCreate.map((cvId) =>
        this.prisma.cvAnalysis.create({
          data: { cvId, status: 'PENDING', processingStartedAt: now },
        }),
      ),
      ...(toClaim.length > 0
        ? [
            this.prisma.cvAnalysis.updateMany({
              where: { cvId: { in: toClaim } },
              data: { processingStartedAt: now },
            }),
          ]
        : []),
    ]);

    return candidates.map((c) => c.id);
  }

  /**
   * Deterministic filtering step. Only ever matches CVs with a COMPLETED
   * analysis — a CV becomes searchable a short while after upload (once the
   * `cv.uploaded` listener or the analyze-pending-cvs cron catches up), not
   * synchronously with the request. `filters.jobId` scopes the pool to
   * candidates who have applied to that job — AI candidate discovery is the
   * recruiter's own applicant pool per job, not a platform-wide search (see
   * CandidateSearchFilters.jobId doc comment).
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
        applications: { some: { jobId: filters.jobId } },
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

  /**
   * `jobId`-scoped the same way as searchCandidatePool — returns null for a
   * real candidate who simply never applied to this job, not just for a
   * nonexistent one, so get_candidate can't be used to look up an arbitrary
   * candidate outside the recruiter's own applicant pool.
   */
  async findCandidateByUserId(userId: string, jobId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        roleRef: { name: 'CANDIDATE' },
        applications: { some: { jobId } },
      },
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
