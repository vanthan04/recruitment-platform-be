"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryMapper = void 0;
const category_entity_1 = require("../../../domain/entities/category.entity");
class CategoryMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new category_entity_1.Category({
            id: raw.id,
            name: raw.name,
            slug: raw.slug,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
    static toPersistence(category) {
        return {
            name: category.name,
            slug: category.slug,
        };
    }
}
exports.CategoryMapper = CategoryMapper;
//# sourceMappingURL=category.mapper.js.map