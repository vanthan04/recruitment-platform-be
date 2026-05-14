"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModule = void 0;
const common_1 = require("@nestjs/common");
const job_controller_1 = require("./presentation/controllers/job.controller");
const job_repository_1 = require("./domain/repositories/job.repository");
const job_infra_repository_1 = require("./infrastructure/repositories/job.infra-repository");
const job_prisma_repository_1 = require("./infrastructure/persistence/prisma/job-prisma.repository");
const create_job_use_case_1 = require("./application/use-cases/create-job.use-case");
const update_job_use_case_1 = require("./application/use-cases/update-job.use-case");
const list_jobs_use_case_1 = require("./application/use-cases/list-jobs.use-case");
const get_job_use_case_1 = require("./application/use-cases/get-job.use-case");
const delete_job_use_case_1 = require("./application/use-cases/delete-job.use-case");
let JobModule = class JobModule {
};
exports.JobModule = JobModule;
exports.JobModule = JobModule = __decorate([
    (0, common_1.Module)({
        controllers: [job_controller_1.JobController],
        providers: [
            job_prisma_repository_1.JobPrismaRepository,
            {
                provide: job_repository_1.IJobRepository,
                useClass: job_infra_repository_1.JobInfraRepository,
            },
            create_job_use_case_1.CreateJobUseCase,
            update_job_use_case_1.UpdateJobUseCase,
            list_jobs_use_case_1.ListJobsUseCase,
            get_job_use_case_1.GetJobUseCase,
            delete_job_use_case_1.DeleteJobUseCase,
        ],
        exports: [job_repository_1.IJobRepository],
    })
], JobModule);
//# sourceMappingURL=job.module.js.map