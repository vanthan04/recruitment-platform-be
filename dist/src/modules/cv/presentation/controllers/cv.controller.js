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
exports.CvController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const create_cv_use_case_1 = require("../../application/use-cases/create-cv.use-case");
const update_cv_use_case_1 = require("../../application/use-cases/update-cv.use-case");
const publish_cv_use_case_1 = require("../../application/use-cases/publish-cv.use-case");
const get_cv_use_case_1 = require("../../application/use-cases/get-cv.use-case");
const list_my_cvs_use_case_1 = require("../../application/use-cases/list-my-cvs.use-case");
const delete_cv_use_case_1 = require("../../application/use-cases/delete-cv.use-case");
const create_cv_dto_1 = require("../dtos/create-cv.dto");
const update_cv_dto_1 = require("../dtos/update-cv.dto");
let CvController = class CvController {
    createCvUseCase;
    updateCvUseCase;
    publishCvUseCase;
    getCvUseCase;
    listMyCvsUseCase;
    deleteCvUseCase;
    constructor(createCvUseCase, updateCvUseCase, publishCvUseCase, getCvUseCase, listMyCvsUseCase, deleteCvUseCase) {
        this.createCvUseCase = createCvUseCase;
        this.updateCvUseCase = updateCvUseCase;
        this.publishCvUseCase = publishCvUseCase;
        this.getCvUseCase = getCvUseCase;
        this.listMyCvsUseCase = listMyCvsUseCase;
        this.deleteCvUseCase = deleteCvUseCase;
    }
    async create(userId, dto) {
        const result = await this.createCvUseCase.execute(userId, {
            title: dto.title,
            summary: dto.summary,
            experiences: dto.experiences?.map((e) => ({
                ...e,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : undefined,
            })),
            educations: dto.educations?.map((e) => ({
                ...e,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : undefined,
            })),
            skills: dto.skills,
        });
        return api_response_1.ApiResponse.ok(result, 'CV created successfully');
    }
    async listMyCvs(userId) {
        const result = await this.listMyCvsUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(result, 'CVs retrieved successfully');
    }
    async getById(id) {
        const result = await this.getCvUseCase.execute(id);
        return api_response_1.ApiResponse.ok(result, 'CV retrieved successfully');
    }
    async update(userId, cvId, dto) {
        const result = await this.updateCvUseCase.execute(userId, cvId, {
            title: dto.title,
            summary: dto.summary,
            experiences: dto.experiences?.map((e) => ({
                ...e,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : undefined,
            })),
            educations: dto.educations?.map((e) => ({
                ...e,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : undefined,
            })),
            skills: dto.skills,
        });
        return api_response_1.ApiResponse.ok(result, 'CV updated successfully');
    }
    async publish(userId, cvId) {
        const result = await this.publishCvUseCase.execute(userId, cvId);
        return api_response_1.ApiResponse.ok(result, 'CV published successfully');
    }
    async delete(userId, cvId) {
        await this.deleteCvUseCase.execute(userId, cvId);
    }
};
exports.CvController = CvController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new CV' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cv_dto_1.CreateCvDto]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'List all my CVs' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "listMyCvs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CV by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update CV' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_cv_dto_1.UpdateCvDto]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Publish CV' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "publish", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete CV (soft delete)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "delete", null);
exports.CvController = CvController = __decorate([
    (0, swagger_1.ApiTags)('cvs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('cvs'),
    __metadata("design:paramtypes", [create_cv_use_case_1.CreateCvUseCase,
        update_cv_use_case_1.UpdateCvUseCase,
        publish_cv_use_case_1.PublishCvUseCase,
        get_cv_use_case_1.GetCvUseCase,
        list_my_cvs_use_case_1.ListMyCvsUseCase,
        delete_cv_use_case_1.DeleteCvUseCase])
], CvController);
//# sourceMappingURL=cv.controller.js.map