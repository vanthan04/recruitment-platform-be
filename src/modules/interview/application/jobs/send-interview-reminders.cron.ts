import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { SendInterviewRemindersCommand } from '@/modules/interview/application/commands/send-interview-reminders.command';

@Injectable()
export class SendInterviewRemindersCron {
  private readonly logger = new Logger(SendInterviewRemindersCron.name);

  constructor(private readonly commandBus: CommandBus) {}

  // Every 15 minutes: a reminder lands within 15 minutes of its target time,
  // which is plenty for "about a day before" / "about two hours before", and
  // each run is one indexed scan of the next 24h of interviews.
  @Cron('*/15 * * * *')
  async handle(): Promise<void> {
    // A throwing @Cron handler is only logged by the scheduler, but catching
    // here keeps the failure in this module's own logs with context.
    try {
      await this.commandBus.execute(new SendInterviewRemindersCommand());
    } catch (err) {
      this.logger.error(
        'Interview reminder run failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
