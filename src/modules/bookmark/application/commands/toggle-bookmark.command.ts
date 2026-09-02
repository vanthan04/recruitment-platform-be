import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { IJobLookupPort } from '@/modules/bookmark/application/ports/job-lookup.port';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class ToggleBookmarkCommand {
  constructor(
    public readonly userId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@CommandHandler(ToggleBookmarkCommand)
export class ToggleBookmarkHandler implements ICommandHandler<ToggleBookmarkCommand, { bookmarked: boolean }> {
  constructor(
    private readonly bookmarkRepository: IBookmarkRepository,
    private readonly jobLookup: IJobLookupPort,
  ) {}

  async execute({ userId, jobId }: ToggleBookmarkCommand): Promise<{ bookmarked: boolean }> {
    const jobExists = await this.jobLookup.exists(jobId);
    if (!jobExists) throw new EntityNotFoundException('Job', jobId);

    const existing = await this.bookmarkRepository.findByUserIdAndJobId(userId, jobId);

    if (existing) {
      await this.bookmarkRepository.delete(userId, jobId);
      return { bookmarked: false };
    }

    const bookmark = new Bookmark({ userId, jobId });
    await this.bookmarkRepository.save(bookmark);
    return { bookmarked: true };
  }
}
