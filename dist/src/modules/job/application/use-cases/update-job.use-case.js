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
exports.UpdateJobUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_repository_1 = require("../../domain/repositories/job.repository");
const category_repository_1 = require("../../../category/domain/repositories/category.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const job_response_mapper_1 = require("../mappers/job-response.mapper");
let UpdateJobUseCase = class UpdateJobUseCase {
    jobRepository;
    categoryRepository;
    constructor(jobRepository, categoryRepository) {
        this.jobRepository = jobRepository;
        this.categoryRepository = categoryRepository;
    }
    async execute(recruiterId, jobId, input) {
        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            throw new domain_exception_1.EntityNotFoundException('Job', jobId);
        }
        job.ensureOwner(recruiterId);
        if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
            throw new domain_exception_1.EntityNotFoundException('Category', input.categoryId);
        }
        job.updateDetails({
            title: input.title,
            description: input.description,
            location: input.location,
            jobType: input.jobType,
            level: input.level !== undefined ? input.level : undefined,
            categoryId: input.categoryId,
            requirements: input.requirements,
            benefits: input.benefits,
            salaryMin: input.salaryMin,
            salaryMax: input.salaryMax,
            currency: input.currency,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        });
        const updated = await this.jobRepository.update(job);
        return job_response_mapper_1.JobResponseMapper.toDto(updated);
    }
};
exports.UpdateJobUseCase = UpdateJobUseCase;
exports.UpdateJobUseCase = UpdateJobUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository,
        category_repository_1.ICategoryRepository])
], UpdateJobUseCase);
//# sourceMappingURL=update-job.use-case.js.map