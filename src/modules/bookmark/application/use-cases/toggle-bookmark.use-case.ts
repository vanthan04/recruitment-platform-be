import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

@Injectable()
export class ToggleBookmarkUseCase {
  constructor(
    private readonly bookmarkRepository: IBookmarkRepository,
    private readonly jobRepository: IJobRepository,
  ) {}

  async execute(userId: string, jobId: string): Promise<{ bookmarked: boolean }> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) throw new EntityNotFoundException('Job', jobId);

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
