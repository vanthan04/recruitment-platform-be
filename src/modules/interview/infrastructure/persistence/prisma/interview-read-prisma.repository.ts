import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma, InterviewStatus } from '@prisma/client';

// Mirrors InterviewSchedule.isActive().
const ACTIVE_STATUSES: InterviewStatus[] = ['SCHEDULED', 'RESCHEDULED'];

const itemInclude = {
  jobApplication: {
    select: {
      userId: true,
      status: true,
      jobId: true,
      job: { select: { title: true, postedById: true } },
      user: { select: { profile: { select: { fullName: true } } } },
    },
  },
  // The open session, if any (at most one — partial unique index).
  sessions: { where: { endedAt: null }, select: { id: true }, take: 1 },
} satisfies Prisma.InterviewScheduleInclude;

export type InterviewItemRaw = Prisma.InterviewScheduleGetPayload<{
  include: typeof itemInclude;
}>;

@Injectable()
export class InterviewReadPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findItemById(id: string): Promise<InterviewItemRaw | null> {
    return this.prisma.interviewSchedule.findUnique({
      where: { id },
      include: itemInclude,
    });
  }

  async findForParticipant(filter: {
    userId: string;
    status?: InterviewStatus;
    upcoming?: boolean;
    inProgress?: boolean;
    skip: number;
    take: number;
  }): Promise<{ items: InterviewItemRaw[]; total: number }> {
    const and: Prisma.InterviewScheduleWhereInput[] = [
      {
        jobApplication: {
          OR: [
            { userId: filter.userId },
            { job: { postedById: filter.userId } },
          ],
        },
      },
    ];
    if (filter.status) and.push({ status: filter.status });
    if (filter.upcoming) {
      and.push({ status: { in: ACTIVE_STATUSES } });
      and.push({ scheduledAt: { gte: new Date() } });
    }
    if (filter.inProgress) and.push({ sessions: { some: { endedAt: null } } });
    const where: Prisma.InterviewScheduleWhereInput = { AND: and };
    const direction = filter.upcoming ? 'asc' : 'desc';

    const [items, total] = await this.prisma.$transaction([
      this.prisma.interviewSchedule.findMany({
        where,
        include: itemInclude,
        orderBy: [{ scheduledAt: direction }, { id: direction }],
        skip: filter.skip,
        take: filter.take,
      }),
      this.prisma.interviewSchedule.count({ where }),
    ]);
    return { items, total };
  }
}
