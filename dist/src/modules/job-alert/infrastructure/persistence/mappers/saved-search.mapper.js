"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchMapper = void 0;
const saved_search_entity_1 = require("../../../domain/entities/saved-search.entity");
class SavedSearchMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new saved_search_entity_1.SavedSearch({
            id: raw.id,
            userId: raw.userId,
            keyword: raw.keyword,
            location: raw.location,
            categoryId: raw.categoryId,
            jobType: raw.jobType,
            createdAt: raw.createdAt,
        });
    }
    static toPersistence(savedSearch) {
        return {
            userId: savedSearch.userId,
            keyword: savedSearch.keyword,
            location: savedSearch.location,
            categoryId: savedSearch.categoryId,
            jobType: savedSearch.jobType,
        };
    }
}
exports.SavedSearchMapper = SavedSearchMapper;
//# sourceMappingURL=saved-search.mapper.js.map