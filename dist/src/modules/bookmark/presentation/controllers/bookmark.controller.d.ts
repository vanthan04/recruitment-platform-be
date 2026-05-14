import { ToggleBookmarkUseCase } from '@/modules/bookmark/application/use-cases/toggle-bookmark.use-case';
import { ListBookmarksUseCase } from '@/modules/bookmark/application/use-cases/list-bookmarks.use-case';
export declare class BookmarkController {
    private readonly toggleBookmarkUseCase;
    private readonly listBookmarksUseCase;
    constructor(toggleBookmarkUseCase: ToggleBookmarkUseCase, listBookmarksUseCase: ListBookmarksUseCase);
    toggle(userId: string, jobId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        bookmarked: boolean;
    }>>;
    list(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/bookmark-response.dto").BookmarkResponseDto>>;
}
