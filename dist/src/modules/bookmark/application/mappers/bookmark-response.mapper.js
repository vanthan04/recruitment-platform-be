"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkResponseMapper = void 0;
const bookmark_response_dto_1 = require("../dto/bookmark-response.dto");
class BookmarkResponseMapper {
    static toDto(bookmark) {
        const dto = new bookmark_response_dto_1.BookmarkResponseDto();
        dto.id = bookmark.id;
        dto.userId = bookmark.userId;
        dto.jobId = bookmark.jobId;
        dto.createdAt = bookmark.createdAt;
        return dto;
    }
    static toDtoList(bookmarks) {
        return bookmarks.map(BookmarkResponseMapper.toDto);
    }
}
exports.BookmarkResponseMapper = BookmarkResponseMapper;
//# sourceMappingURL=bookmark-response.mapper.js.map