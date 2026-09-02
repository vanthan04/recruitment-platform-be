import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

/**
 * Periodically closes OPEN jobs whose `expiresAt` has passed.
 */
@Injectable()
export class CloseExpiredJobsCron {
  private readonly logger = new Logger(CloseExpiredJobsCron.name);

  constructor(private readonly jobRepository: IJobRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
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
