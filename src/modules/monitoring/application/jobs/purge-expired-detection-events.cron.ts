import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { PurgeExpiredDetectionEventsCommand } from '@/modules/monitoring/application/commands/purge-expired-detection-events.command';

@Injectable()
export class PurgeExpiredDetectionEventsCron {
  private readonly logger = new Logger(PurgeExpiredDetectionEventsCron.name);

  constructor(private readonly commandBus: CommandBus) {}

  // Daily at 03:30 — retention is measured in days, so once a day is enough.
  @Cron('30 3 * * *')
  async handle(): Promise<void> {
    try {
      await this.commandBus.execute(new PurgeExpiredDetectionEventsCommand());
    } catch (err) {
      this.logger.error(
        'Monitoring event retention purge failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
