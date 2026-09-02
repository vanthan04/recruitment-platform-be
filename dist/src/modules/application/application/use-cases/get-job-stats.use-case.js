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
exports.GetJobStatsUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_application_repository_1 = require("../../domain/repositories/job-application.repository");
const job_repository_1 = require("../../../job/domain/repositories/job.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const application_status_vo_1 = require("../../domain/value-objects/application-status.vo");
const job_stats_response_dto_1 = require("../dto/job-stats-response.dto");
let GetJobStatsUseCase = class GetJobStatsUseCase {
    applicationRepository;
    jobRepository;
    constructor(applicationRepository, jobRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
    }
    async execute(recruiterId, jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job)
            throw new domain_exception_1.EntityNotFoundException('Job', jobId);
        if (job.postedById !== recruiterId) {
            throw new domain_exception_1.UnauthorizedDomainException('Only the job poster can view job stats');
        }
        const counts = await this.applicationRepository.countByJobIdGroupedByStatus(jobId);
        const dto = new job_stats_response_dto_1.JobStatsResponseDto();
        dto.jobId = jobId;
        dto.viewCount = job.viewCount;
        dto.pending = counts[application_status_vo_1.ApplicationStatus.PENDING] ?? 0;
        dto.accepted = counts[application_status_vo_1.ApplicationStatus.ACCEPTED] ?? 0;
        dto.rejected = counts[application_status_vo_1.ApplicationStatus.REJECTED] ?? 0;
        dto.withdrawn = counts[application_status_vo_1.ApplicationStatus.WITHDRAWN] ?? 0;
        dto.totalApplications = dto.pending + dto.accepted + dto.rejected + dto.withdrawn;
        return dto;
    }
};
exports.GetJobStatsUseCase = GetJobStatsUseCase;
exports.GetJobStatsUseCase = GetJobStatsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_application_repository_1.IJobApplicationRepository,
        job_repository_1.IJobRepository])
], GetJobStatsUseCase);
//# sourceMappingURL=get-job-stats.use-case.js.map