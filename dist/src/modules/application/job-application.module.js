"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationModule = void 0;
const common_1 = require("@nestjs/common");
const job_application_controller_1 = require("./presentation/controllers/job-application.controller");
const job_application_repository_1 = require("./domain/repositories/job-application.repository");
const job_application_infra_repository_1 = require("./infrastructure/repositories/job-application.infra-repository");
const job_application_prisma_repository_1 = require("./infrastructure/persistence/prisma/job-application-prisma.repository");
const job_module_1 = require("../job/job.module");
const cv_module_1 = require("../cv/cv.module");
const apply_job_use_case_1 = require("./application/use-cases/apply-job.use-case");
const update_application_status_use_case_1 = require("./application/use-cases/update-application-status.use-case");
const list_my_applications_use_case_1 = require("./application/use-cases/list-my-applications.use-case");
const list_applications_by_job_use_case_1 = require("./application/use-cases/list-applications-by-job.use-case");
const withdraw_application_use_case_1 = require("./application/use-cases/withdraw-application.use-case");
const get_job_stats_use_case_1 = require("./application/use-cases/get-job-stats.use-case");
let JobApplicationModule = class JobApplicationModule {
};
exports.JobApplicationModule = JobApplicationModule;
exports.JobApplicationModule = JobApplicationModule = __decorate([
    (0, common_1.Module)({
        imports: [job_module_1.JobModule, cv_module_1.CvModule],
        controllers: [job_application_controller_1.JobApplicationController],
        providers: [
            job_application_prisma_repository_1.JobApplicationPrismaRepository,
            {
                provide: job_application_repository_1.IJobApplicationRepository,
                useClass: job_application_infra_repository_1.JobApplicationInfraRepository,
            },
            apply_job_use_case_1.ApplyJobUseCase,
            update_application_status_use_case_1.UpdateApplicationStatusUseCase,
            list_my_applications_use_case_1.ListMyApplicationsUseCase,
            list_applications_by_job_use_case_1.ListApplicationsByJobUseCase,
            withdraw_application_use_case_1.WithdrawApplicationUseCase,
            get_job_stats_use_case_1.GetJobStatsUseCase,
        ],
    })
], JobApplicationModule);
//# sourceMappingURL=job-application.module.js.map