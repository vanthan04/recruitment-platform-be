import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma, InterviewStatus } from '@prisma/client';

// The "still pending" statuses — mirrors InterviewSchedule.isActive().
const ACTIVE_STATUSES: InterviewStatus[] = ['SCHEDULED', 'RESCHEDULED'];

@Injectable()
export class InterviewSchedulePrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.interviewSchedule.findUnique({
      where: { id },
    });
  }

  async findByApplicationId(jobApplicationId: string) {
    return this.prisma.interviewSchedule.findMany({
      where: { jobApplicationId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async create(data: Prisma.InterviewScheduleUncheckedCreateInput) {
    return this.prisma.interviewSchedule.create({ data });
  }

  async update(id: string, data: Prisma.InterviewScheduleUncheckedUpdateInput) {
    return this.prisma.interviewSchedule.update({
      where: { id },
      data,
    });
  }

  async findUnremindedStartingBetween(from: Date, to: Date, limit: number) {
    return this.prisma.interviewSchedule.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        reminderSentAt: null,
        scheduledAt: { gt: from, lte: to },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  /** Returns how many rows changed: 1 if this caller claimed it, 0 if it lost the race (or the row changed). */
  async claimReminder(id: string, scheduledAt: Date, at: Date) {
    const { count } = await this.prisma.interviewSchedule.updateMany({
      where: {
        id,
        scheduledAt,
        reminderSentAt: null,
        status: { in: ACTIVE_STATUSES },
      },
      data: { reminderSentAt: at },
    });
    return count;
  }
}
