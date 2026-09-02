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
exports.CategoryInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const category_prisma_repository_1 = require("../persistence/prisma/category-prisma.repository");
const category_mapper_1 = require("../persistence/mappers/category.mapper");
let CategoryInfraRepository = class CategoryInfraRepository {
    categoryPrisma;
    constructor(categoryPrisma) {
        this.categoryPrisma = categoryPrisma;
    }
    async findById(id) {
        const raw = await this.categoryPrisma.findById(id);
        return category_mapper_1.CategoryMapper.toDomain(raw);
    }
    async existsBySlug(slug) {
        return this.categoryPrisma.existsBySlug(slug);
    }
    async findAll() {
        const raws = await this.categoryPrisma.findAll();
        return raws.map((r) => category_mapper_1.CategoryMapper.toDomain(r));
    }
    async save(category) {
        const data = category_mapper_1.CategoryMapper.toPersistence(category);
        const raw = await this.categoryPrisma.create(data);
        return category_mapper_1.CategoryMapper.toDomain(raw);
    }
    async update(category) {
        const data = category_mapper_1.CategoryMapper.toPersistence(category);
        const raw = await this.categoryPrisma.update(category.id, data);
        return category_mapper_1.CategoryMapper.toDomain(raw);
    }
    async delete(id) {
        await this.categoryPrisma.delete(id);
    }
};
exports.CategoryInfraRepository = CategoryInfraRepository;
exports.CategoryInfraRepository = CategoryInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [category_prisma_repository_1.CategoryPrismaRepository])
], CategoryInfraRepository);
//# sourceMappingURL=category.infra-repository.js.map