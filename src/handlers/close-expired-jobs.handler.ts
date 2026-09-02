import 'source-map-support/register';
import { INestApplicationContext } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { ScheduledHandler } from 'aws-lambda';
import { createAppContext } from '@/bootstrap';
import { CloseExpiredJobsCommand } from '@/modules/job/application/commands/close-expired-jobs.command';

/**
 * EventBridge Scheduler target — replaces the former `@Cron(EVERY_HOUR)` job.
 * Schedule this rule to fire hourly (rate(1 hour)) to preserve the original
 * cadence; the business logic itself still lives in CloseExpiredJobsHandler.
 */
let appContext: INestApplicationContext | undefined;

export const handler: ScheduledHandler = async () => {
  appContext ??= await createAppContext();
  const commandBus = appContext.get(CommandBus);
  await commandBus.execute(new CloseExpiredJobsCommand());
};
