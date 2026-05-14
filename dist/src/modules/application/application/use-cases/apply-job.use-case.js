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
exports.ApplyJobUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_application_repository_1 = require("../../domain/repositories/job-application.repository");
const job_repository_1 = require("../../../job/domain/repositories/job.repository");
const cv_repository_1 = require("../../../cv/domain/repositories/cv.repository");
const job_application_entity_1 = require("../../domain/entities/job-application.entity");
const job_domain_service_1 = require("../../../job/domain/domain-services/job-domain.service");
const cv_domain_service_1 = require("../../../cv/domain/domain-services/cv-domain.service");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const application_response_mapper_1 = require("../mappers/application-response.mapper");
let ApplyJobUseCase = class ApplyJobUseCase {
    applicationRepository;
    jobRepository;
    cvRepository;
    constructor(applicationRepository, jobRepository, cvRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.cvRepository = cvRepository;
    }
    async execute(userId, input) {
        const [job, cv] = await Promise.all([
            this.jobRepository.findById(input.jobId),
            this.cvRepository.findById(input.cvId),
        ]);
        if (!job)
            throw new domain_exception_1.EntityNotFoundException('Job', input.jobId);
        if (!cv)
            throw new domain_exception_1.EntityNotFoundException('CV', input.cvId);
        job_domain_service_1.JobDomainService.validateAcceptingApplications(job);
        cv_domain_service_1.CvDomainService.validateForApplication(cv);
        cv.ensureOwner(userId);
        const existing = await this.applicationRepository.findByUserIdAndJobId(userId, input.jobId);
        if (existing) {
            throw new domain_exception_1.DuplicateEntityException('Application', 'jobId');
        }
        const application = new job_application_entity_1.JobApplication({
            userId,
            jobId: input.jobId,
            cvId: input.cvId,
            coverLetter: input.coverLetter ?? null,
        });
        const saved = await this.applicationRepository.save(application);
        return application_response_mapper_1.ApplicationResponseMapper.toDto(saved);
    }
};
exports.ApplyJobUseCase = ApplyJobUseCase;
exports.ApplyJobUseCase = ApplyJobUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_application_repository_1.IJobApplicationRepository,
        job_repository_1.IJobRepository,
        cv_repository_1.ICvRepository])
], ApplyJobUseCase);
//# sourceMappingURL=apply-job.use-case.js.map