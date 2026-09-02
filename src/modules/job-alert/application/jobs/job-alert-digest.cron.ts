import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { SendJobAlertDigestsCommand } from '@/modules/job-alert/application/commands/send-job-alert-digests.command';

/**
 * Once a day, checks every saved search for newly posted jobs (created in the
 * last 24h) matching its filters, and emails the candidate a digest.
 */
@Injectable()
export class JobAlertDigestCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleCron(): Promise<void> {
    await this.commandBus.execute(new SendJobAlertDigestsCommand());
  }
}
