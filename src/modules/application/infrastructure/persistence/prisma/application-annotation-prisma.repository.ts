import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class ApplicationAnnotationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotes(applicationId: string) {
    return this.prisma.applicationNote.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNote(id: string) {
    return this.prisma.applicationNote.findUnique({ where: { id } });
  }

  async createNote(data: Prisma.ApplicationNoteUncheckedCreateInput) {
    return this.prisma.applicationNote.create({ data });
  }

  async deleteNote(id: string) {
    await this.prisma.applicationNote.delete({ where: { id } });
  }

  /** Writes the star column alone — see IApplicationAnnotationRepository. */
  async setStarred(applicationId: string, starredAt: Date | null) {
    await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { starredAt },
    });
  }

  async findStarredApplicationIds(applicationIds: string[]) {
    if (applicationIds.length === 0) return [];
    return this.prisma.jobApplication.findMany({
      where: { id: { in: applicationIds }, starredAt: { not: null } },
      select: { id: true },
    });
  }
}
