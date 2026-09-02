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
exports.WithdrawApplicationUseCase = void 0;
const common_1 = require("@nestjs/common");
const job_application_repository_1 = require("../../domain/repositories/job-application.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const application_response_mapper_1 = require("../mappers/application-response.mapper");
let WithdrawApplicationUseCase = class WithdrawApplicationUseCase {
    applicationRepository;
    constructor(applicationRepository) {
        this.applicationRepository = applicationRepository;
    }
    async execute(userId, applicationId) {
        const application = await this.applicationRepository.findById(applicationId);
        if (!application) {
            throw new domain_exception_1.EntityNotFoundException('Application', applicationId);
        }
        if (application.userId !== userId) {
            throw new domain_exception_1.UnauthorizedDomainException('You are not the owner of this application');
        }
        application.withdraw();
        const updated = await this.applicationRepository.update(application);
        return application_response_mapper_1.ApplicationResponseMapper.toDto(updated);
    }
};
exports.WithdrawApplicationUseCase = WithdrawApplicationUseCase;
exports.WithdrawApplicationUseCase = WithdrawApplicationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_application_repository_1.IJobApplicationRepository])
], WithdrawApplicationUseCase);
//# sourceMappingURL=withdraw-application.use-case.js.map