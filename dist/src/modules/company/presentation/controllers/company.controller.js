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
exports.CompanyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const api_response_1 = require("../../../../common/dtos/api-response");
const create_company_use_case_1 = require("../../application/use-cases/create-company.use-case");
const update_company_use_case_1 = require("../../application/use-cases/update-company.use-case");
const get_company_use_case_1 = require("../../application/use-cases/get-company.use-case");
const list_companies_use_case_1 = require("../../application/use-cases/list-companies.use-case");
const delete_company_use_case_1 = require("../../application/use-cases/delete-company.use-case");
const create_company_dto_1 = require("../dtos/create-company.dto");
const update_company_dto_1 = require("../dtos/update-company.dto");
const search_company_dto_1 = require("../dtos/search-company.dto");
let CompanyController = class CompanyController {
    createCompanyUseCase;
    updateCompanyUseCase;
    getCompanyUseCase;
    listCompaniesUseCase;
    deleteCompanyUseCase;
    constructor(createCompanyUseCase, updateCompanyUseCase, getCompanyUseCase, listCompaniesUseCase, deleteCompanyUseCase) {
        this.createCompanyUseCase = createCompanyUseCase;
        this.updateCompanyUseCase = updateCompanyUseCase;
        this.getCompanyUseCase = getCompanyUseCase;
        this.listCompaniesUseCase = listCompaniesUseCase;
        this.deleteCompanyUseCase = deleteCompanyUseCase;
    }
    async create(recruiterId, dto) {
        const result = await this.createCompanyUseCase.execute(recruiterId, dto);
        return api_response_1.ApiResponse.ok(result, 'Company created successfully');
    }
    async list(query) {
        const result = await this.listCompaniesUseCase.execute({
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            keyword: query.keyword,
            industry: query.industry,
        });
        return api_response_1.ApiResponse.ok(result.companies, 'Companies retrieved successfully', {
            total: result.total,
            page: result.page,
            limit: result.limit,
        });
    }
    async getById(id) {
        const result = await this.getCompanyUseCase.execute(id);
        return api_response_1.ApiResponse.ok(result, 'Company retrieved successfully');
    }
    async update(recruiterId, companyId, dto) {
        const result = await this.updateCompanyUseCase.execute(recruiterId, companyId, dto);
        return api_response_1.ApiResponse.ok(result, 'Company updated successfully');
    }
    async delete(recruiterId, companyId) {
        await this.deleteCompanyUseCase.execute(recruiterId, companyId);
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Create my company (Recruiter only, 1 per recruiter)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_company_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List and search companies' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_company_dto_1.SearchCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company by ID (with its open jobs)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Update company (Owner only)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.RECRUITER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete company (Owner only, soft delete)' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "delete", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('companies'),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [create_company_use_case_1.CreateCompanyUseCase,
        update_company_use_case_1.UpdateCompanyUseCase,
        get_company_use_case_1.GetCompanyUseCase,
        list_companies_use_case_1.ListCompaniesUseCase,
        delete_company_use_case_1.DeleteCompanyUseCase])
], CompanyController);
//# sourceMappingURL=company.controller.js.map