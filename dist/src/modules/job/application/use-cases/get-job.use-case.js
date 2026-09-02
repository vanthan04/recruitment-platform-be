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
var GetJobUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetJobUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_repository_1 = require("../../domain/repositories/job.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const job_response_mapper_1 = require("../mappers/job-response.mapper");
let GetJobUseCase = GetJobUseCase_1 = class GetJobUseCase {
    jobRepository;
    logger = new common_1.Logger(GetJobUseCase_1.name);
    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }
    async execute(jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            throw new domain_exception_1.EntityNotFoundException('Job', jobId);
        }
        this.jobRepository
            .incrementViewCount(jobId)
            .catch((err) => this.logger.error('Failed to increment job view count', err));
        return job_response_mapper_1.JobResponseMapper.toDto(job);
    }
};
exports.GetJobUseCase = GetJobUseCase;
exports.GetJobUseCase = GetJobUseCase = GetJobUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository])
], GetJobUseCase);
//# sourceMappingURL=get-job.use-case.js.map