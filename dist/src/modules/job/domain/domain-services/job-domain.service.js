"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobDomainService = void 0;
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class JobDomainService {
    static validateAcceptingApplications(job) {
        if (!job.isOpen) {
            throw new domain_exception_1.BusinessRuleViolationException('This job is not currently accepting applications');
        }
        if (job.isExpired) {
            throw new domain_exception_1.BusinessRuleViolationException('This job posting has expired');
        }
        if (job.isDeleted) {
            throw new domain_exception_1.BusinessRuleViolationException('This job posting has been removed');
        }
    }
}
exports.JobDomainService = JobDomainService;
//# sourceMappingURL=job-domain.service.js.map