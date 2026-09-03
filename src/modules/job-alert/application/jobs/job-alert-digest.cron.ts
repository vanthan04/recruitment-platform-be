import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { SendJobAlertDigestsCommand } from '@/modules/job-alert/application/commands/send-job-alert-digests.command';

@Injectable()
export class JobAlertDigestCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron('0 7 * * *')
  async handle(): Promise<void> {
    await this.commandBus.execute(new SendJobAlertDigestsCommand());
  }
}
