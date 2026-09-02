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
exports.JobController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const create_job_use_case_1 = require("../../application/use-cases/create-job.use-case");
const update_job_use_case_1 = require("../../application/use-cases/update-job.use-case");
const list_jobs_use_case_1 = require("../../application/use-cases/list-jobs.use-case");
const get_job_use_case_1 = require("../../application/use-cases/get-job.use-case");
const delete_job_use_case_1 = require("../../application/use-cases/delete-job.use-case");
const close_job_use_case_1 = require("../../application/use-cases/close-job.use-case");
const reopen_job_use_case_1 = require("../../application/use-cases/reopen-job.use-case");
const create_job_dto_1 = require("../dtos/create-job.dto");
const update_job_dto_1 = require("../dtos/update-job.dto");
const search_job_dto_1 = require("../dtos/search-job.dto");
let JobController = class JobController {
    createJobUseCase;
    updateJobUseCase;
    listJobsUseCase;
    getJobUseCase;
    deleteJobUseCase;
    closeJobUseCase;
    reopenJobUseCase;
    constructor(createJobUseCase, updateJobUseCase, listJobsUseCase, getJobUseCase, deleteJobUseCase, closeJobUseCase, reopenJobUseCase) {
        this.createJobUseCase = createJobUseCase;
        this.updateJobUseCase = updateJobUseCase;
        this.listJobsUseCase = listJobsUseCase;
        this.getJobUseCase = getJobUseCase;
        this.deleteJobUseCase = deleteJobUseCase;
        this.closeJobUseCase = closeJobUseCase;
        this.reopenJobUseCase = reopenJobUseCase;
    }
    async create(recruiterId, dto) {
        const result = await this.createJobUseCase.execute(recruiterId, dto);
        return api_response_1.ApiResponse.ok(result, 'Job created successfully');
    }
    async list(query) {
        const result = await this.listJobsUseCase.execute({
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            keyword: query.keyword,
            location: query.location,
            jobType: query.jobType,
            salaryMin: query.salaryMin,
            salaryMax: query.salaryMax,
            companyId: query.companyId,
            categoryId: query.categoryId,
            level: query.level,
        });
        return api_response_1.ApiResponse.ok(result.jobs, 'Jobs retrieved successfully', {
            total: result.total,
            page: result.page,
            limit: result.limit,
        });
    }
    async getById(id) {
        const result = await this.getJobUseCase.execute(id);
        return api_response_1.ApiResponse.ok(result, 'Job retrieved successfully');
    }
    async update(recruiterId, jobId, dto) {
        const result = await this.updateJobUseCase.execute(recruiterId, jobId, dto);
        return api_response_1.ApiResponse.ok(result, 'Job updated successfully');
    }
    async delete(recruiterId, jobId) {
        await this.deleteJobUseCase.execute(recruiterId, jobId);
    }
    async close(recruiterId, jobId) {
        const result = await this.closeJobUseCase.execute(recruiterId, jobId);
        return api_response_1.ApiResponse.ok(result, 'Job closed successfully');
    }
    async reopen(recruiterId, jobId) {
        const result = await this.reopenJobUseCase.execute(recruiterId, jobId);
        return api_response_1.ApiResponse.ok(result, 'Job reopened successfully');
    }
};
exports.JobController = JobController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new job (Recruiter only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_job_dto_1.CreateJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List and search jobs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_job_dto_1.SearchJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get job by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Update job (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_job_dto_1.UpdateJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete job (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Close job, stop accepting applications (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/reopen'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Reopen a closed job (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "reopen", null);
exports.JobController = JobController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [create_job_use_case_1.CreateJobUseCase,
        update_job_use_case_1.UpdateJobUseCase,
        list_jobs_use_case_1.ListJobsUseCase,
        get_job_use_case_1.GetJobUseCase,
        delete_job_use_case_1.DeleteJobUseCase,
        close_job_use_case_1.CloseJobUseCase,
        reopen_job_use_case_1.ReopenJobUseCase])
], JobController);
//# sourceMappingURL=job.controller.js.map