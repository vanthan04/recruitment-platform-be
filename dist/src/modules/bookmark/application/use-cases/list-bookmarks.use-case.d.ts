import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkResponseDto } from '@/modules/bookmark/application/dto/bookmark-response.dto';
export declare class ListBookmarksUseCase {
    private readonly bookmarkRepository;
    constructor(bookmarkRepository: IBookmarkRepository);
    execute(userId: string): Promise<BookmarkResponseDto[]>;
}
