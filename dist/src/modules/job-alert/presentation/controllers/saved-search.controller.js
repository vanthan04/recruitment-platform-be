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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const create_saved_search_use_case_1 = require("../../application/use-cases/create-saved-search.use-case");
const list_my_saved_searches_use_case_1 = require("../../application/use-cases/list-my-saved-searches.use-case");
const delete_saved_search_use_case_1 = require("../../application/use-cases/delete-saved-search.use-case");
const create_saved_search_dto_1 = require("../dtos/create-saved-search.dto");
let SavedSearchController = class SavedSearchController {
    createSavedSearchUseCase;
    listMySavedSearchesUseCase;
    deleteSavedSearchUseCase;
    constructor(createSavedSearchUseCase, listMySavedSearchesUseCase, deleteSavedSearchUseCase) {
        this.createSavedSearchUseCase = createSavedSearchUseCase;
        this.listMySavedSearchesUseCase = listMySavedSearchesUseCase;
        this.deleteSavedSearchUseCase = deleteSavedSearchUseCase;
    }
    async create(userId, dto) {
        const result = await this.createSavedSearchUseCase.execute(userId, dto);
        return api_response_1.ApiResponse.ok(result, 'Saved search created successfully');
    }
    async list(userId) {
        const result = await this.listMySavedSearchesUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(result, 'Saved searches retrieved successfully');
    }
    async delete(userId, savedSearchId) {
        await this.deleteSavedSearchUseCase.execute(userId, savedSearchId);
    }
};
exports.SavedSearchController = SavedSearchController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Save a search to get emailed when matching jobs are posted (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_saved_search_dto_1.CreateSavedSearchDto]),
    __metadata("design:returntype", Promise)
], SavedSearchController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'List my saved searches (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SavedSearchController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a saved search (owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SavedSearchController.prototype, "delete", null);
exports.SavedSearchController = SavedSearchController = __decorate([
    (0, swagger_1.ApiTags)('saved-searches'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('saved-searches'),
    __metadata("design:paramtypes", [create_saved_search_use_case_1.CreateSavedSearchUseCase,
        list_my_saved_searches_use_case_1.ListMySavedSearchesUseCase,
        delete_saved_search_use_case_1.DeleteSavedSearchUseCase])
], SavedSearchController);
//# sourceMappingURL=saved-search.controller.js.map