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
exports.BookmarkController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const toggle_bookmark_use_case_1 = require("../../application/use-cases/toggle-bookmark.use-case");
const list_bookmarks_use_case_1 = require("../../application/use-cases/list-bookmarks.use-case");
let BookmarkController = class BookmarkController {
    toggleBookmarkUseCase;
    listBookmarksUseCase;
    constructor(toggleBookmarkUseCase, listBookmarksUseCase) {
        this.toggleBookmarkUseCase = toggleBookmarkUseCase;
        this.listBookmarksUseCase = listBookmarksUseCase;
    }
    async toggle(userId, jobId) {
        const result = await this.toggleBookmarkUseCase.execute(userId, jobId);
        return api_response_1.ApiResponse.ok(result, result.bookmarked ? 'Job bookmarked' : 'Bookmark removed');
    }
    async list(userId) {
        const result = await this.listBookmarksUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(result, 'Bookmarks retrieved successfully');
    }
};
exports.BookmarkController = BookmarkController;
__decorate([
    (0, common_1.Post)('toggle/:jobId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle bookmark for a job (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "toggle", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'List my bookmarked jobs (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "list", null);
exports.BookmarkController = BookmarkController = __decorate([
    (0, swagger_1.ApiTags)('bookmarks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('bookmarks'),
    __metadata("design:paramtypes", [toggle_bookmark_use_case_1.ToggleBookmarkUseCase,
        list_bookmarks_use_case_1.ListBookmarksUseCase])
], BookmarkController);
//# sourceMappingURL=bookmark.controller.js.map