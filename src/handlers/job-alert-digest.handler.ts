import 'source-map-support/register';
import { INestApplicationContext } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { ScheduledHandler } from 'aws-lambda';
import { createAppContext } from '@/bootstrap';
import { SendJobAlertDigestsCommand } from '@/modules/job-alert/application/commands/send-job-alert-digests.command';

/**
 * EventBridge Scheduler target — replaces the former `@Cron(EVERY_DAY_AT_7AM)`
 * job. Schedule this rule as `cron(0 7 * * ? *)` (UTC) to preserve the
 * original cadence; the business logic itself still lives in
 * SendJobAlertDigestsHandler.
 */
let appContext: INestApplicationContext | undefined;

export const handler: ScheduledHandler = async () => {
  appContext ??= await createAppContext();
  const commandBus = appContext.get(CommandBus);
  await commandBus.execute(new SendJobAlertDigestsCommand());
};
