import { Injectable } from '@nestjs/common';
import {
  IApplicationStatusHistoryRepository,
  CreateApplicationStatusHistoryInput,
  ApplicationStatusHistoryEntry,
} from '@/modules/application/domain/repositories/application-status-history.repository';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { ApplicationStatusHistoryPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/application-status-history-prisma.repository';

@Injectable()
export class ApplicationStatusHistoryInfraRepository implements IApplicationStatusHistoryRepository {
  constructor(
    private readonly historyPrisma: ApplicationStatusHistoryPrismaRepository,
  ) {}

  async create(input: CreateApplicationStatusHistoryInput): Promise<void> {
    await this.historyPrisma.create(input);
  }

  async findByApplicationId(
    applicationId: string,
  ): Promise<ApplicationStatusHistoryEntry[]> {
    const raws = await this.historyPrisma.findByApplicationId(applicationId);
    return raws.map((raw: any) => ({
      id: raw.id,
      fromStatus: raw.fromStatus as ApplicationStatus | null,
      toStatus: raw.toStatus as ApplicationStatus,
      note: raw.note,
      changedById: raw.changedById,
      createdAt: raw.createdAt,
    }));
  }
}
