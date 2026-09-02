"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchResponseMapper = void 0;
const saved_search_response_dto_1 = require("../dto/saved-search-response.dto");
class SavedSearchResponseMapper {
    static toDto(savedSearch) {
        const dto = new saved_search_response_dto_1.SavedSearchResponseDto();
        dto.id = savedSearch.id;
        dto.keyword = savedSearch.keyword;
        dto.location = savedSearch.location;
        dto.categoryId = savedSearch.categoryId;
        dto.jobType = savedSearch.jobType;
        dto.createdAt = savedSearch.createdAt;
        return dto;
    }
    static toDtoList(savedSearches) {
        return savedSearches.map(SavedSearchResponseMapper.toDto);
    }
}
exports.SavedSearchResponseMapper = SavedSearchResponseMapper;
//# sourceMappingURL=saved-search-response.mapper.js.map