"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryUseCase = void 0;
const common_1 = require("@nestjs/common");
const category_repository_1 = require("../../domain/repositories/category.repository");
const category_entity_1 = require("../../domain/entities/category.entity");
const category_response_mapper_1 = require("../mappers/category-response.mapper");
let CreateCategoryUseCase = class CreateCategoryUseCase {
    categoryRepository;
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async execute(input) {
        const slug = await this.generateUniqueSlug(input.name);
        const category = new category_entity_1.Category({ name: input.name, slug });
        const saved = await this.categoryRepository.save(category);
        return category_response_mapper_1.CategoryResponseMapper.toDto(saved);
    }
    async generateUniqueSlug(name) {
        const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        let slug = base;
        let suffix = 1;
        while (await this.categoryRepository.existsBySlug(slug)) {
            slug = `${base}-${++suffix}`;
        }
        return slug;
    }
};
exports.CreateCategoryUseCase = CreateCategoryUseCase;
exports.CreateCategoryUseCase = CreateCategoryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [category_repository_1.ICategoryRepository])
], CreateCategoryUseCase);
//# sourceMappingURL=create-category.use-case.js.map