import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InterviewSessionPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.interviewSession.findUnique({ where: { id } });
  }

  findByInterviewId(interviewId: string) {
    return this.prisma.interviewSession.findMany({
      where: { interviewId },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
  }

  findOpenByInterviewId(interviewId: string) {
    return this.prisma.interviewSession.findFirst({
      where: { interviewId, endedAt: null },
    });
  }

  create(data: Prisma.InterviewSessionUncheckedCreateInput) {
    return this.prisma.interviewSession.create({ data });
  }

  update(id: string, data: Prisma.InterviewSessionUncheckedUpdateInput) {
    return this.prisma.interviewSession.update({ where: { id }, data });
  }
}
