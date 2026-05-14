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

  async findByIdWithRelations(id: string) {
    return this.prisma.cv.findFirst({
      where: { id, deletedAt: null },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        skills: { orderBy: { name: 'asc' } },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.cv.findMany({
      where: { userId, deletedAt: null },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        skills: { orderBy: { name: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.cv.create({
      data,
      include: {
        experiences: true,
        educations: true,
        skills: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.cv.update({
      where: { id },
      data,
      include: {
        experiences: true,
        educations: true,
        skills: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.cv.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DRAFT' },
    });
  }

  async hardDelete(id: string) {
    return this.prisma.cv.delete({ where: { id } });
  }

  async deleteExperiencesByCvId(cvId: string) {
    return this.prisma.experience.deleteMany({ where: { cvId } });
  }

  async deleteEducationsByCvId(cvId: string) {
    return this.prisma.education.deleteMany({ where: { cvId } });
  }

  async deleteSkillsByCvId(cvId: string) {
    return this.prisma.skill.deleteMany({ where: { cvId } });
  }
}
