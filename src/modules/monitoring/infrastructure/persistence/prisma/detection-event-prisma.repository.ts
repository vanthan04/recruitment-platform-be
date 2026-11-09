import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

const withInterview = {
  session: { select: { interviewId: true } },
} satisfies Prisma.InterviewDetectionEventInclude;

export type DetectionEventRaw = Prisma.InterviewDetectionEventGetPayload<{
  include: typeof withInterview;
}>;

@Injectable()
export class DetectionEventPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InterviewDetectionEventUncheckedCreateInput) {
    const row = await this.prisma.interviewDetectionEvent.create({
      data,
      select: { id: true },
    });
    return row.id;
  }

  async update(
    id: string,
    data: Prisma.InterviewDetectionEventUncheckedUpdateInput,
  ): Promise<DetectionEventRaw> {
    return this.prisma.interviewDetectionEvent.update({
      where: { id },
      data,
      include: withInterview,
    });
  }

  findById(id: string): Promise<DetectionEventRaw | null> {
    return this.prisma.interviewDetectionEvent.findUnique({
      where: { id },
      include: withInterview,
    });
  }

  async list(
    where: Prisma.InterviewDetectionEventWhereInput,
    skip: number,
    take: number,
  ): Promise<{ items: DetectionEventRaw[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.interviewDetectionEvent.findMany({
        where,
        include: withInterview,
        orderBy: [{ detectedAt: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.interviewDetectionEvent.count({ where }),
    ]);
    return { items, total };
  }

  async groupCounts(interviewId: string) {
    const where = { session: { interviewId } };
    const [all, unreviewed] = await this.prisma.$transaction([
      this.prisma.interviewDetectionEvent.groupBy({
        by: ['interviewSessionId', 'eventType'],
        where,
        orderBy: [{ interviewSessionId: 'asc' }, { eventType: 'asc' }],
        _count: { _all: true },
      }),
      this.prisma.interviewDetectionEvent.groupBy({
        by: ['interviewSessionId', 'eventType'],
        where: { ...where, reviewedAt: null },
        orderBy: [{ interviewSessionId: 'asc' }, { eventType: 'asc' }],
        _count: { _all: true },
      }),
    ]);
    return { all, unreviewed };
  }

  async deleteDetectedBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.interviewDetectionEvent.deleteMany({
      where: { detectedAt: { lt: cutoff } },
    });
    return count;
  }
}
