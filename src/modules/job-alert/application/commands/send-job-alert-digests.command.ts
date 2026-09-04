import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { IJobSearchPort } from '@/modules/job-alert/application/ports/job-search.port';
import { IUserLookupPort } from '@/modules/job-alert/application/ports/user-lookup.port';
import { IMailPort } from '@/modules/job-alert/application/ports/mail.port';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class SendJobAlertDigestsCommand {}

@Injectable()
@CommandHandler(SendJobAlertDigestsCommand)
export class SendJobAlertDigestsHandler implements ICommandHandler<
  SendJobAlertDigestsCommand,
  void
> {
  private readonly logger = new Logger(SendJobAlertDigestsHandler.name);

  constructor(
    private readonly savedSearchRepository: ISavedSearchRepository,
    private readonly jobSearchPort: IJobSearchPort,
    private readonly userLookupPort: IUserLookupPort,
    private readonly mailPort: IMailPort,
  ) {}

  async execute(): Promise<void> {
    const savedSearches = await this.savedSearchRepository.findAll();
    const since = new Date(Date.now() - ONE_DAY_MS);
    let emailsSent = 0;

    for (const search of savedSearches) {
      const newJobs = await this.jobSearchPort.findRecentMatchingJobs(
        {
          keyword: search.keyword ?? undefined,
          location: search.location ?? undefined,
          employmentType: search.employmentType ?? undefined,
          workMode: search.workMode ?? undefined,
          categoryId: search.categoryId ?? undefined,
        },
        since,
      );

      if (newJobs.length === 0) continue;

      const user = await this.userLookupPort.findById(search.userId);
      if (!user) continue;

      const jobListHtml = newJobs
        .map(
          (job) =>
            `<li>${job.title} — ${job.companyName ?? ''} (${job.location})</li>`,
        )
        .join('');

      await this.mailPort.sendEmail({
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
