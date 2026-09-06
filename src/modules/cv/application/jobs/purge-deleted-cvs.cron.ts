import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { PurgeDeletedCvsCommand } from '@/modules/cv/application/commands/purge-deleted-cvs.command';

@Injectable()
export class PurgeDeletedCvsCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron('0 4 * * *') // Daily at 4am — off-peak, alongside the other daily cleanup crons.
  async handle(): Promise<void> {
    await this.commandBus.execute(new PurgeDeletedCvsCommand());
  }
}
