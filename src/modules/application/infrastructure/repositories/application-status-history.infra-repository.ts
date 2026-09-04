import { Injectable } from '@nestjs/common';
import {
  IApplicationStatusHistoryRepository,
  CreateApplicationStatusHistoryInput,
} from '@/modules/application/domain/repositories/application-status-history.repository';
import { ApplicationStatusHistoryPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/application-status-history-prisma.repository';

@Injectable()
export class ApplicationStatusHistoryInfraRepository implements IApplicationStatusHistoryRepository {
  constructor(
    private readonly historyPrisma: ApplicationStatusHistoryPrismaRepository,
  ) {}

  async create(input: CreateApplicationStatusHistoryInput): Promise<void> {
    await this.historyPrisma.create(input);
  }
}
