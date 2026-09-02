import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

/**
 * Dispatched by the hourly cron trigger (`close-expired-jobs.cron.ts`).
 */
export class CloseExpiredJobsCommand {}

@Injectable()
@CommandHandler(CloseExpiredJobsCommand)
export class CloseExpiredJobsHandler implements ICommandHandler<
  CloseExpiredJobsCommand,
  void
> {
  private readonly logger = new Logger(CloseExpiredJobsHandler.name);

  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(): Promise<void> {
    const expiredJobs = await this.jobRepository.findExpiredOpenJobs();

    for (const job of expiredJobs) {
      job.close();
      await this.jobRepository.update(job);
    }

    if (expiredJobs.length > 0) {
      this.logger.log(`Closed ${expiredJobs.length} expired job(s)`);
    }
  }
}
