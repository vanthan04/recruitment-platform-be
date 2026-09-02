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
exports.ReopenJobUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_repository_1 = require("../../domain/repositories/job.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const job_response_mapper_1 = require("../mappers/job-response.mapper");
let ReopenJobUseCase = class ReopenJobUseCase {
    jobRepository;
    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }
    async execute(recruiterId, jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            throw new domain_exception_1.EntityNotFoundException('Job', jobId);
        }
        job.ensureOwner(recruiterId);
        job.reopen();
        const updated = await this.jobRepository.update(job);
        return job_response_mapper_1.JobResponseMapper.toDto(updated);
    }
};
exports.ReopenJobUseCase = ReopenJobUseCase;
exports.ReopenJobUseCase = ReopenJobUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository])
], ReopenJobUseCase);
//# sourceMappingURL=reopen-job.use-case.js.map