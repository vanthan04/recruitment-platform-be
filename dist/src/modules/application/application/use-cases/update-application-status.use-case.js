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
exports.UpdateApplicationStatusUseCase = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const job_application_repository_1 = require("../../domain/repositories/job-application.repository");
const job_repository_1 = require("../../../job/domain/repositories/job.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const application_response_mapper_1 = require("../mappers/application-response.mapper");
const application_status_vo_1 = require("../../domain/value-objects/application-status.vo");
const application_status_changed_event_1 = require("../../infrastructure/events/application-status-changed.event");
let UpdateApplicationStatusUseCase = class UpdateApplicationStatusUseCase {
    applicationRepository;
    jobRepository;
    eventEmitter;
    constructor(applicationRepository, jobRepository, eventEmitter) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.eventEmitter = eventEmitter;
    }
    async execute(recruiterId, applicationId, status) {
        const application = await this.applicationRepository.findById(applicationId);
        if (!application)
            throw new domain_exception_1.EntityNotFoundException('Application', applicationId);
        const job = await this.jobRepository.findById(application.jobId);
        if (!job)
            throw new domain_exception_1.EntityNotFoundException('Job', application.jobId);
        if (job.postedById !== recruiterId) {
            throw new domain_exception_1.UnauthorizedDomainException('Only the job poster can update status');
        }
        if (status === application_status_vo_1.ApplicationStatus.ACCEPTED) {
            application.accept();
        }
        else if (status === application_status_vo_1.ApplicationStatus.REJECTED) {
            application.reject();
        }
        const updated = await this.applicationRepository.update(application);
        this.eventEmitter.emit(application_status_changed_event_1.APPLICATION_STATUS_CHANGED_EVENT, new application_status_changed_event_1.ApplicationStatusChangedEvent(updated.id, updated.userId, job.id, job.title, updated.status));
        return application_response_mapper_1.ApplicationResponseMapper.toDto(updated);
    }
};
exports.UpdateApplicationStatusUseCase = UpdateApplicationStatusUseCase;
exports.UpdateApplicationStatusUseCase = UpdateApplicationStatusUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_application_repository_1.IJobApplicationRepository,
        job_repository_1.IJobRepository,
        event_emitter_1.EventEmitter2])
], UpdateApplicationStatusUseCase);
//# sourceMappingURL=update-application-status.use-case.js.map