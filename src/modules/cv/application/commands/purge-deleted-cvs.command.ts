import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';

const RETENTION_DAYS = 30;

/**
 * Dispatched by the daily cron trigger (`purge-deleted-cvs.cron.ts`).
 * DeleteCvHandler only ever soft-deletes (sets `deletedAt`) — the S3 object
 * itself is never touched, so without this, every "deleted" CV's file lives
 * in the bucket forever. This purges both the DB row and the S3 object once
 * a CV has been soft-deleted for longer than the retention window, giving a
 * candidate a window to be certain before it's actually gone.
 */
export class PurgeDeletedCvsCommand {}

@Injectable()
@CommandHandler(PurgeDeletedCvsCommand)
export class PurgeDeletedCvsHandler implements ICommandHandler<
  PurgeDeletedCvsCommand,
  void
> {
  private readonly logger = new Logger(PurgeDeletedCvsHandler.name);

  constructor(
    private readonly cvRepository: ICvRepository,
    @Inject(ICvStoragePort)
    private readonly cvStorage: ICvStoragePort,
  ) {}

  async execute(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await this.cvRepository.findSoftDeletedBefore(cutoff);

    let purged = 0;
    let failures = 0;

    for (const cv of candidates) {
      try {
        // Best-effort: an S3 object that's already gone (or a transient S3
        // error) shouldn't stop the DB row from being purged — a stray S3
        // object with no DB row left is harmless clutter, but a DB row that
        // never gets purged because S3 flaked once is a permanent leak.
        await this.cvStorage.delete(cv.fileKey).catch((err) => {
          this.logger.warn(
            `Failed to delete S3 object for purged CV ${cv.id} (key: ${cv.fileKey}): ${err instanceof Error ? err.message : err}`,
          );
        });
        await this.cvRepository.delete(cv.id);
        purged++;
      } catch (err) {
        failures++;
        this.logger.error(
          `Failed to purge soft-deleted CV ${cv.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    if (purged > 0 || failures > 0) {
      this.logger.log(
        `Purged ${purged} soft-deleted CV(s) past the ${RETENTION_DAYS}-day retention window${failures > 0 ? `, ${failures} failed` : ''}`,
      );
    }
  }
}
