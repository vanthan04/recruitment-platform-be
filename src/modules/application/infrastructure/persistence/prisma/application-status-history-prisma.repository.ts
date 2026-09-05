import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class ApplicationStatusHistoryPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.applicationStatusHistory.create({ data });
  }

  async findByApplicationId(applicationId: string) {
    return this.prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
