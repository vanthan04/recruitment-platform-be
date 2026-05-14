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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const get_my_profile_use_case_1 = require("../../application/use-cases/get-my-profile.use-case");
const update_profile_use_case_1 = require("../../application/use-cases/update-profile.use-case");
const update_profile_dto_1 = require("../dtos/update-profile.dto");
const api_response_1 = require("../../../../common/dtos/api-response");
let UserController = class UserController {
    getMyProfileUseCase;
    updateProfileUseCase;
    constructor(getMyProfileUseCase, updateProfileUseCase) {
        this.getMyProfileUseCase = getMyProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
    }
    async getMe(userId) {
        const result = await this.getMyProfileUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(result);
    }
    async updateProfile(userId, dto) {
        const result = await this.updateProfileUseCase.execute(userId, dto);
        return api_response_1.ApiResponse.ok(result, 'Cập nhật profile thành công');
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin profile cá nhân' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin profile cá nhân' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [get_my_profile_use_case_1.GetMyProfileUseCase,
        update_profile_use_case_1.UpdateProfileUseCase])
], UserController);
//# sourceMappingURL=user.controller.js.map