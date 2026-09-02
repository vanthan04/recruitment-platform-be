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
exports.ListMySavedSearchesUseCase = void 0;
const common_1 = require("@nestjs/common");
const saved_search_repository_1 = require("../../domain/repositories/saved-search.repository");
const saved_search_response_mapper_1 = require("../mappers/saved-search-response.mapper");
let ListMySavedSearchesUseCase = class ListMySavedSearchesUseCase {
    savedSearchRepository;
    constructor(savedSearchRepository) {
        this.savedSearchRepository = savedSearchRepository;
    }
    async execute(userId) {
        const savedSearches = await this.savedSearchRepository.findAllByUserId(userId);
        return saved_search_response_mapper_1.SavedSearchResponseMapper.toDtoList(savedSearches);
    }
};
exports.ListMySavedSearchesUseCase = ListMySavedSearchesUseCase;
exports.ListMySavedSearchesUseCase = ListMySavedSearchesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saved_search_repository_1.ISavedSearchRepository])
], ListMySavedSearchesUseCase);
//# sourceMappingURL=list-my-saved-searches.use-case.js.map