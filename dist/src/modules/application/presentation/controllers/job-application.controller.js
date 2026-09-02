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
exports.JobApplicationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const apply_job_use_case_1 = require("../../application/use-cases/apply-job.use-case");
const update_application_status_use_case_1 = require("../../application/use-cases/update-application-status.use-case");
const list_my_applications_use_case_1 = require("../../application/use-cases/list-my-applications.use-case");
const list_applications_by_job_use_case_1 = require("../../application/use-cases/list-applications-by-job.use-case");
const withdraw_application_use_case_1 = require("../../application/use-cases/withdraw-application.use-case");
const get_job_stats_use_case_1 = require("../../application/use-cases/get-job-stats.use-case");
const apply_job_dto_1 = require("../dtos/apply-job.dto");
const update_application_status_dto_1 = require("../dtos/update-application-status.dto");
let JobApplicationController = class JobApplicationController {
    applyJobUseCase;
    updateStatusUseCase;
    listMyAppsUseCase;
    listByJobUseCase;
    withdrawApplicationUseCase;
    getJobStatsUseCase;
    constructor(applyJobUseCase, updateStatusUseCase, listMyAppsUseCase, listByJobUseCase, withdrawApplicationUseCase, getJobStatsUseCase) {
        this.applyJobUseCase = applyJobUseCase;
        this.updateStatusUseCase = updateStatusUseCase;
        this.listMyAppsUseCase = listMyAppsUseCase;
        this.listByJobUseCase = listByJobUseCase;
        this.withdrawApplicationUseCase = withdrawApplicationUseCase;
        this.getJobStatsUseCase = getJobStatsUseCase;
    }
    async apply(userId, dto) {
        const result = await this.applyJobUseCase.execute(userId, dto);
        return api_response_1.ApiResponse.ok(result, 'Application submitted successfully');
    }
    async listMyApplications(userId) {
        const result = await this.listMyAppsUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(result, 'Applications retrieved successfully');
    }
    async listByJob(recruiterId, jobId) {
        const result = await this.listByJobUseCase.execute(recruiterId, jobId);
        return api_response_1.ApiResponse.ok(result, 'Applications retrieved successfully');
    }
    async getJobStats(recruiterId, jobId) {
        const result = await this.getJobStatsUseCase.execute(recruiterId, jobId);
        return api_response_1.ApiResponse.ok(result, 'Job stats retrieved successfully');
    }
    async withdraw(userId, id) {
        const result = await this.withdrawApplicationUseCase.execute(userId, id);
        return api_response_1.ApiResponse.ok(result, 'Application withdrawn successfully');
    }
    async updateStatus(recruiterId, id, dto) {
        const result = await this.updateStatusUseCase.execute(recruiterId, id, dto.status);
        return api_response_1.ApiResponse.ok(result, 'Application status updated successfully');
    }
};
exports.JobApplicationController = JobApplicationController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for a job (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, apply_job_dto_1.ApplyJobDto]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('my-applications'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'List my applications (Candidate only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "listMyApplications", null);
__decorate([
    (0, common_1.Get)('job/:jobId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'List applications for a specific job (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "listByJob", null);
__decorate([
    (0, common_1.Get)('job/:jobId/stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Get application stats + view count for a job (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "getJobStats", null);
__decorate([
    (0, common_1.Patch)(':id/withdraw'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CANDIDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw a pending application (Candidate owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Update application status (Recruiter owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_application_status_dto_1.UpdateApplicationStatusDto]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "updateStatus", null);
exports.JobApplicationController = JobApplicationController = __decorate([
    (0, swagger_1.ApiTags)('job-applications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('job-applications'),
    __metadata("design:paramtypes", [apply_job_use_case_1.ApplyJobUseCase,
        update_application_status_use_case_1.UpdateApplicationStatusUseCase,
        list_my_applications_use_case_1.ListMyApplicationsUseCase,
        list_applications_by_job_use_case_1.ListApplicationsByJobUseCase,
        withdraw_application_use_case_1.WithdrawApplicationUseCase,
        get_job_stats_use_case_1.GetJobStatsUseCase])
], JobApplicationController);
//# sourceMappingURL=job-application.controller.js.map