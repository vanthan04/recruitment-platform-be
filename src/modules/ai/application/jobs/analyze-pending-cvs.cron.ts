import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';

/**
 * Safety net for the `cv.uploaded` event: catches CVs left PENDING/FAILED
 * by a listener failure or a process restart mid-analysis, and backfills
 * any CV uploaded before this feature existed. Bounded batch size (see
 * AI_ANALYSIS_BATCH_SIZE) so a large backlog can't spike AI provider cost
 * or request volume in one run.
 *
 * claimPendingCvIds (not a plain read) marks each returned CV's
 * processingStartedAt before this method ever calls analyzeCv — so if this
 * same cron's *next* tick fires while this run is still working through a
 * slow batch, it won't re-claim (and re-analyze, doubling AI provider cost)
 * a CV this run already has in flight. See AI_ANALYSIS_CLAIM_STALE_MINUTES.
 */
@Injectable()
export class AnalyzePendingCvsCron {
  private readonly logger = new Logger(AnalyzePendingCvsCron.name);

  constructor(
    private readonly cvAnalysisRepository: ICvAnalysisRepository,
    private readonly cvAnalysisService: CvAnalysisService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handle(): Promise<void> {
    const batchSize = this.configService.get<number>(
      'AI_ANALYSIS_BATCH_SIZE',
      20,
    );
    const staleAfterMs =
      this.configService.get<number>('AI_ANALYSIS_CLAIM_STALE_MINUTES', 5) *
      60_000;
    const cvIds = await this.cvAnalysisRepository.claimPendingCvIds(
      batchSize,
      staleAfterMs,
    );
    if (cvIds.length === 0) return;

    this.logger.log(
      `AnalyzePendingCvsCron: analyzing ${cvIds.length} pending CV(s)`,
    );
    for (const cvId of cvIds) {
      // CvAnalysisService never throws — a single CV's failure must not
      // abort the rest of the batch.
      await this.cvAnalysisService.analyzeCv(cvId);
    }
  }
}
