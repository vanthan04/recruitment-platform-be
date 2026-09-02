import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Once a day, checks every saved search for newly posted jobs (created in the
 * last 24h) matching its filters, and emails the candidate a digest.
 */
@Injectable()
export class JobAlertDigestCron {
  private readonly logger = new Logger(JobAlertDigestCron.name);

  constructor(
    private readonly savedSearchRepository: ISavedSearchRepository,
    private readonly jobRepository: IJobRepository,
    private readonly userRepository: IUserRepository,
    private readonly mailService: IMailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleCron(): Promise<void> {
    const savedSearches = await this.savedSearchRepository.findAll();
    const since = new Date(Date.now() - ONE_DAY_MS);
    let emailsSent = 0;

    for (const search of savedSearches) {
      const { jobs } = await this.jobRepository.findAllPaginated({
        page: 1,
        limit: 20,
        keyword: search.keyword ?? undefined,
        location: search.location ?? undefined,
        jobType: search.jobType ?? undefined,
        categoryId: search.categoryId ?? undefined,
      });

      const newJobs = jobs.filter((job) => job.createdAt >= since);
      if (newJobs.length === 0) continue;

      const user = await this.userRepository.findById(search.userId);
      if (!user) continue;

      const jobListHtml = newJobs
        .map((job) => `<li>${job.title} — ${job.company?.name ?? ''} (${job.location})</li>`)
        .join('');

      await this.mailService.sendEmail({
        to: user.email,
        subject: `${newJobs.length} new job(s) matching your saved search`,
        html: `<p>Here are new jobs matching your saved search:</p><ul>${jobListHtml}</ul>`,
        text: newJobs.map((job) => `${job.title} — ${job.location}`).join('\n'),
      });
      emailsSent++;
    }

    if (emailsSent > 0) {
      this.logger.log(`Sent ${emailsSent} job alert digest email(s)`);
    }
  }
}
