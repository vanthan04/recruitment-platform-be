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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListJobsUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_repository_1 = require("../../domain/repositories/job.repository");
const job_response_mapper_1 = require("../mappers/job-response.mapper");
let ListJobsUseCase = class ListJobsUseCase {
    jobRepository;
    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }
    async execute(input) {
        const { jobs, total } = await this.jobRepository.findAllPaginated(input);
        return {
            jobs: job_response_mapper_1.JobResponseMapper.toDtoList(jobs),
            total,
            page: input.page,
            limit: input.limit,
        };
    }
};
exports.ListJobsUseCase = ListJobsUseCase;
exports.ListJobsUseCase = ListJobsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository])
], ListJobsUseCase);
//# sourceMappingURL=list-jobs.use-case.js.map