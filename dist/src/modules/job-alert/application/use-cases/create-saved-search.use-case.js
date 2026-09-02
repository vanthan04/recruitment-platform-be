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
exports.CreateSavedSearchUseCase = void 0;
const common_1 = require("@nestjs/common");
const saved_search_repository_1 = require("../../domain/repositories/saved-search.repository");
const category_repository_1 = require("../../../category/domain/repositories/category.repository");
const saved_search_entity_1 = require("../../domain/entities/saved-search.entity");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const saved_search_response_mapper_1 = require("../mappers/saved-search-response.mapper");
let CreateSavedSearchUseCase = class CreateSavedSearchUseCase {
    savedSearchRepository;
    categoryRepository;
    constructor(savedSearchRepository, categoryRepository) {
        this.savedSearchRepository = savedSearchRepository;
        this.categoryRepository = categoryRepository;
    }
    async execute(userId, input) {
        if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
            throw new domain_exception_1.EntityNotFoundException('Category', input.categoryId);
        }
        const savedSearch = new saved_search_entity_1.SavedSearch({
            userId,
            keyword: input.keyword ?? null,
            location: input.location ?? null,
            categoryId: input.categoryId ?? null,
            jobType: input.jobType ?? null,
        });
        const saved = await this.savedSearchRepository.save(savedSearch);
        return saved_search_response_mapper_1.SavedSearchResponseMapper.toDto(saved);
    }
};
exports.CreateSavedSearchUseCase = CreateSavedSearchUseCase;
exports.CreateSavedSearchUseCase = CreateSavedSearchUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saved_search_repository_1.ISavedSearchRepository,
        category_repository_1.ICategoryRepository])
], CreateSavedSearchUseCase);
//# sourceMappingURL=create-saved-search.use-case.js.map