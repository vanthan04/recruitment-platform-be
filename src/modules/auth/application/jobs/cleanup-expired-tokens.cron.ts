import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { CleanupExpiredTokensCommand } from '@/modules/auth/application/commands/cleanup-expired-tokens.command';

@Injectable()
export class CleanupExpiredTokensCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron('0 3 * * *') // Daily at 3am — off-peak, no need for hourly like job-closing.
  async handle(): Promise<void> {
    await this.commandBus.execute(new CleanupExpiredTokensCommand());
  }
}
