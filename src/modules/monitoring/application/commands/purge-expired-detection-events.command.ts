import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

export class PurgeExpiredDetectionEventsCommand extends Command<number> {
  constructor(public readonly now: Date = new Date()) {
    super();
  }
}

/** Retention: monitoring events are deleted MONITORING_EVENT_RETENTION_DAYS after they were detected. */
@Injectable()
@CommandHandler(PurgeExpiredDetectionEventsCommand)
export class PurgeExpiredDetectionEventsHandler implements ICommandHandler<
  PurgeExpiredDetectionEventsCommand,
  number
> {
  private readonly logger = new Logger(PurgeExpiredDetectionEventsHandler.name);
  private readonly retentionDays: number;

  constructor(
    private readonly events: IDetectionEventRepository,
    config: ConfigService,
  ) {
    this.retentionDays = config.get<number>(
      'MONITORING_EVENT_RETENTION_DAYS',
      180,
    );
  }

  async execute({ now }: PurgeExpiredDetectionEventsCommand): Promise<number> {
    const cutoff = new Date(now.getTime() - this.retentionDays * DAY_MS);
    const deleted = await this.events.deleteDetectedBefore(cutoff);
    if (deleted > 0) {
      this.logger.log(
        `Deleted ${deleted} monitoring event(s) older than ${this.retentionDays} days`,
      );
    }
    return deleted;
  }
}
