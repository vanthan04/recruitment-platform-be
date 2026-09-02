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
exports.CreateJobUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_repository_1 = require("../../domain/repositories/job.repository");
const user_repository_1 = require("../../../user/domain/repositories/user.repository");
const category_repository_1 = require("../../../category/domain/repositories/category.repository");
const job_entity_1 = require("../../domain/entities/job.entity");
const job_type_vo_1 = require("../../domain/value-objects/job-type.vo");
const salary_range_vo_1 = require("../../domain/value-objects/salary-range.vo");
const job_response_mapper_1 = require("../mappers/job-response.mapper");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
let CreateJobUseCase = class CreateJobUseCase {
    jobRepository;
    userRepository;
    categoryRepository;
    constructor(jobRepository, userRepository, categoryRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }
    async execute(recruiterId, input) {
        const recruiter = await this.userRepository.findById(recruiterId);
        if (!recruiter?.companyId) {
            throw new domain_exception_1.BusinessRuleViolationException('You must create a company profile before posting a job');
        }
        if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
            throw new domain_exception_1.EntityNotFoundException('Category', input.categoryId);
        }
        const job = new job_entity_1.Job({
            title: input.title,
            description: input.description,
            companyId: recruiter.companyId,
            categoryId: input.categoryId ?? null,
            location: input.location,
            jobType: input.jobType ?? job_type_vo_1.JobType.FULL_TIME,
            level: input.level ?? null,
            salary: new salary_range_vo_1.SalaryRange(input.salaryMin ?? null, input.salaryMax ?? null, input.currency ?? 'VND'),
            requirements: input.requirements ?? null,
            benefits: input.benefits ?? null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            postedById: recruiterId,
        });
        job.open();
        const saved = await this.jobRepository.save(job);
        return job_response_mapper_1.JobResponseMapper.toDto(saved);
    }
};
exports.CreateJobUseCase = CreateJobUseCase;
exports.CreateJobUseCase = CreateJobUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository,
        user_repository_1.IUserRepository,
        category_repository_1.ICategoryRepository])
], CreateJobUseCase);
//# sourceMappingURL=create-job.use-case.js.map