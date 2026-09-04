import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

/**
 * Low-level Prisma data access for CV.
 * Wraps the PrismaService delegate for CV-related queries.
 */
@Injectable()
export class CvPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.cv.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.cv.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.cv.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.cv.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.cv.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string) {
    return this.prisma.cv.delete({ where: { id } });
  }

  /**
   * Recruiter -> Job -> JobApplication -> Cv access chain: true if the
   * given recruiter posted a Job that a JobApplication referencing this
   * CV was submitted to.
   */
  async hasRecruiterAccess(
    cvId: string,
    recruiterId: string,
  ): Promise<boolean> {
    const count = await this.prisma.jobApplication.count({
      where: { cvId, job: { postedById: recruiterId } },
    });
    return count > 0;
  }
}
