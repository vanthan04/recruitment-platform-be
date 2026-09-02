import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

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

  async create(data: any) {
    return this.prisma.interviewSchedule.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.interviewSchedule.update({
      where: { id },
      data,
    });
  }
}
