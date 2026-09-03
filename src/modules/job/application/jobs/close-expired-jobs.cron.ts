import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { CloseExpiredJobsCommand } from '@/modules/job/application/commands/close-expired-jobs.command';

@Injectable()
export class CloseExpiredJobsCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handle(): Promise<void> {
    await this.commandBus.execute(new CloseExpiredJobsCommand());
  }
}
