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
exports.SavedSearchInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const saved_search_prisma_repository_1 = require("../persistence/prisma/saved-search-prisma.repository");
const saved_search_mapper_1 = require("../persistence/mappers/saved-search.mapper");
let SavedSearchInfraRepository = class SavedSearchInfraRepository {
    savedSearchPrisma;
    constructor(savedSearchPrisma) {
        this.savedSearchPrisma = savedSearchPrisma;
    }
    async findById(id) {
        const raw = await this.savedSearchPrisma.findById(id);
        return saved_search_mapper_1.SavedSearchMapper.toDomain(raw);
    }
    async findAllByUserId(userId) {
        const raws = await this.savedSearchPrisma.findAllByUserId(userId);
        return raws.map((r) => saved_search_mapper_1.SavedSearchMapper.toDomain(r));
    }
    async findAll() {
        const raws = await this.savedSearchPrisma.findAll();
        return raws.map((r) => saved_search_mapper_1.SavedSearchMapper.toDomain(r));
    }
    async save(savedSearch) {
        const data = saved_search_mapper_1.SavedSearchMapper.toPersistence(savedSearch);
        const raw = await this.savedSearchPrisma.create(data);
        return saved_search_mapper_1.SavedSearchMapper.toDomain(raw);
    }
    async delete(id) {
        await this.savedSearchPrisma.delete(id);
    }
};
exports.SavedSearchInfraRepository = SavedSearchInfraRepository;
exports.SavedSearchInfraRepository = SavedSearchInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saved_search_prisma_repository_1.SavedSearchPrismaRepository])
], SavedSearchInfraRepository);
//# sourceMappingURL=saved-search.infra-repository.js.map