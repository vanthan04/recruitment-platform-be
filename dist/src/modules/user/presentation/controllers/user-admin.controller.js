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
exports.UserAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../auth/presentation/security/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const admin_list_users_use_case_1 = require("../../application/use-cases/admin-list-users.use-case");
const admin_update_user_status_use_case_1 = require("../../application/use-cases/admin-update-user-status.use-case");
const admin_update_user_status_dto_1 = require("../dtos/admin-update-user-status.dto");
let UserAdminController = class UserAdminController {
    adminListUsersUseCase;
    adminUpdateUserStatusUseCase;
    constructor(adminListUsersUseCase, adminUpdateUserStatusUseCase) {
        this.adminListUsersUseCase = adminListUsersUseCase;
        this.adminUpdateUserStatusUseCase = adminUpdateUserStatusUseCase;
    }
    async listUsers(page, limit) {
        return this.adminListUsersUseCase.execute(page, limit);
    }
    async updateStatus(userId, dto) {
        return this.adminUpdateUserStatusUseCase.execute(userId, dto);
    }
};
exports.UserAdminController = UserAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách người dùng (Admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserAdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật trạng thái hoặc quyền hạn người dùng (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_update_user_status_dto_1.AdminUpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], UserAdminController.prototype, "updateStatus", null);
exports.UserAdminController = UserAdminController = __decorate([
    (0, swagger_1.ApiTags)('admin/users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [admin_list_users_use_case_1.AdminListUsersUseCase,
        admin_update_user_status_use_case_1.AdminUpdateUserStatusUseCase])
], UserAdminController);
//# sourceMappingURL=user-admin.controller.js.map