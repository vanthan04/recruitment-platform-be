import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { IJobSearchPort } from '@/modules/job-alert/application/ports/job-search.port';
import { IUserLookupPort } from '@/modules/job-alert/application/ports/user-lookup.port';
import { IMailPort } from '@/modules/job-alert/application/ports/mail.port';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 200;

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
    const since = new Date(Date.now() - ONE_DAY_MS);
    let emailsSent = 0;
    let failures = 0;
    let cursor: string | undefined;

    // Keyset-paginated in batches rather than one findAll() covering the
    // whole table — at scale (hundreds of thousands of saved searches) a
    // single unbounded query plus a fully sequential loop over all of it
    // risks both a memory spike and a run long enough to overlap tomorrow's
    // scheduled fire.
    for (;;) {
      const batch = await this.savedSearchRepository.findBatch({
        cursor,
        take: BATCH_SIZE,
      });
      if (batch.length === 0) break;

      for (const search of batch) {
        try {
          await this.sendDigestFor(search, since);
          emailsSent++;
        } catch (err) {
          // One recipient's bad address / a transient SMTP error must not
          // cancel the digest for everyone processed after them.
          failures++;
          this.logger.error(
            `Failed to send job alert digest for saved search ${search.id}`,
            err instanceof Error ? err.stack : err,
          );
        }
      }

      cursor = batch[batch.length - 1].id;
    }

    if (emailsSent > 0 || failures > 0) {
      this.logger.log(
        `Sent ${emailsSent} job alert digest email(s)${failures > 0 ? `, ${failures} failed` : ''}`,
      );
    }
  }

  private async sendDigestFor(
    search: Awaited<
      ReturnType<ISavedSearchRepository['findBatch']>
    >[number],
    since: Date,
  ): Promise<void> {
    const { items: newJobs, total } =
      await this.jobSearchPort.findRecentMatchingJobs(
        {
          keyword: search.keyword ?? undefined,
          location: search.location ?? undefined,
          employmentType: search.employmentType ?? undefined,
          workMode: search.workMode ?? undefined,
          categoryId: search.categoryId ?? undefined,
        },
        since,
      );

    if (total === 0) return;

    const user = await this.userLookupPort.findById(search.userId);
    if (!user) return;

    const moreCount = total - newJobs.length;
    const jobListHtml =
      newJobs
        .map(
          (job) =>
            `<li>${job.title} — ${job.companyName ?? ''} (${job.location})</li>`,
        )
        .join('') +
      (moreCount > 0 ? `<li>...and ${moreCount} more</li>` : '');
    const jobListText =
      newJobs.map((job) => `${job.title} — ${job.location}`).join('\n') +
      (moreCount > 0 ? `\n...and ${moreCount} more` : '');

    await this.mailPort.sendEmail({
      to: user.email,
      subject: `${total} new job(s) matching your saved search`,
      html: `<p>Here are new jobs matching your saved search:</p><ul>${jobListHtml}</ul>`,
      text: jobListText,
    });
  }
}
