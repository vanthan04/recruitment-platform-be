"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModule = void 0;
const common_1 = require("@nestjs/common");
const company_controller_1 = require("./presentation/controllers/company.controller");
const company_repository_1 = require("./domain/repositories/company.repository");
const company_infra_repository_1 = require("./infrastructure/repositories/company.infra-repository");
const company_prisma_repository_1 = require("./infrastructure/persistence/prisma/company-prisma.repository");
const user_module_1 = require("../user/user.module");
const job_module_1 = require("../job/job.module");
const create_company_use_case_1 = require("./application/use-cases/create-company.use-case");
const update_company_use_case_1 = require("./application/use-cases/update-company.use-case");
const get_company_use_case_1 = require("./application/use-cases/get-company.use-case");
const list_companies_use_case_1 = require("./application/use-cases/list-companies.use-case");
const delete_company_use_case_1 = require("./application/use-cases/delete-company.use-case");
let CompanyModule = class CompanyModule {
};
exports.CompanyModule = CompanyModule;
exports.CompanyModule = CompanyModule = __decorate([
    (0, common_1.Module)({
        imports: [user_module_1.UserModule, job_module_1.JobModule],
        controllers: [company_controller_1.CompanyController],
        providers: [
            company_prisma_repository_1.CompanyPrismaRepository,
            {
                provide: company_repository_1.ICompanyRepository,
                useClass: company_infra_repository_1.CompanyInfraRepository,
            },
            create_company_use_case_1.CreateCompanyUseCase,
            update_company_use_case_1.UpdateCompanyUseCase,
            get_company_use_case_1.GetCompanyUseCase,
            list_companies_use_case_1.ListCompaniesUseCase,
            delete_company_use_case_1.DeleteCompanyUseCase,
        ],
        exports: [company_repository_1.ICompanyRepository],
    })
], CompanyModule);
//# sourceMappingURL=company.module.js.map