import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
export declare class ToggleBookmarkUseCase {
    private readonly bookmarkRepository;
    private readonly jobRepository;
    constructor(bookmarkRepository: IBookmarkRepository, jobRepository: IJobRepository);
    execute(userId: string, jobId: string): Promise<{
        bookmarked: boolean;
    }>;
}
