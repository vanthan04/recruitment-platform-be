"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplication = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
const application_status_vo_1 = require("../value-objects/application-status.vo");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class JobApplication extends base_entity_1.BaseEntity {
    status;
    coverLetter;
    userId;
    jobId;
    cvId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.status = partial.status ?? application_status_vo_1.ApplicationStatus.PENDING;
    }
    accept() {
        if (this.status !== application_status_vo_1.ApplicationStatus.PENDING) {
            throw new domain_exception_1.BusinessRuleViolationException('Only pending applications can be accepted');
        }
        this.status = application_status_vo_1.ApplicationStatus.ACCEPTED;
    }
    reject() {
        if (this.status !== application_status_vo_1.ApplicationStatus.PENDING) {
            throw new domain_exception_1.BusinessRuleViolationException('Only pending applications can be rejected');
        }
        this.status = application_status_vo_1.ApplicationStatus.REJECTED;
    }
    isPending() {
        return this.status === application_status_vo_1.ApplicationStatus.PENDING;
    }
}
exports.JobApplication = JobApplication;
//# sourceMappingURL=job-application.entity.js.map