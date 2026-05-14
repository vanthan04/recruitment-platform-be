"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkMapper = void 0;
const bookmark_entity_1 = require("../../../domain/entities/bookmark.entity");
class BookmarkMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new bookmark_entity_1.Bookmark({
            id: raw.id,
            userId: raw.userId,
            jobId: raw.jobId,
            createdAt: raw.createdAt,
        });
    }
    static toPersistence(bookmark) {
        return {
            userId: bookmark.userId,
            jobId: bookmark.jobId,
        };
    }
}
exports.BookmarkMapper = BookmarkMapper;
//# sourceMappingURL=bookmark.mapper.js.map