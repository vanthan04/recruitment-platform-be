"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryResponseMapper = void 0;
const category_response_dto_1 = require("../dto/category-response.dto");
class CategoryResponseMapper {
    static toDto(category) {
        const dto = new category_response_dto_1.CategoryResponseDto();
        dto.id = category.id;
        dto.name = category.name;
        dto.slug = category.slug;
        dto.createdAt = category.createdAt;
        dto.updatedAt = category.updatedAt;
        return dto;
    }
    static toDtoList(categories) {
        return categories.map(CategoryResponseMapper.toDto);
    }
}
exports.CategoryResponseMapper = CategoryResponseMapper;
//# sourceMappingURL=category-response.mapper.js.map