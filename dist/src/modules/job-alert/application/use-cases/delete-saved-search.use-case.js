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
exports.DeleteSavedSearchUseCase = void 0;
const common_1 = require("@nestjs/common");
const saved_search_repository_1 = require("../../domain/repositories/saved-search.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
let DeleteSavedSearchUseCase = class DeleteSavedSearchUseCase {
    savedSearchRepository;
    constructor(savedSearchRepository) {
        this.savedSearchRepository = savedSearchRepository;
    }
    async execute(userId, savedSearchId) {
        const savedSearch = await this.savedSearchRepository.findById(savedSearchId);
        if (!savedSearch) {
            throw new domain_exception_1.EntityNotFoundException('SavedSearch', savedSearchId);
        }
        if (savedSearch.userId !== userId) {
            throw new domain_exception_1.UnauthorizedDomainException('You are not the owner of this saved search');
        }
        await this.savedSearchRepository.delete(savedSearchId);
    }
};
exports.DeleteSavedSearchUseCase = DeleteSavedSearchUseCase;
exports.DeleteSavedSearchUseCase = DeleteSavedSearchUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saved_search_repository_1.ISavedSearchRepository])
], DeleteSavedSearchUseCase);
//# sourceMappingURL=delete-saved-search.use-case.js.map