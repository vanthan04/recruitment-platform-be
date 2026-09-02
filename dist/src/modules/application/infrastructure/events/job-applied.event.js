"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAppliedEvent = exports.JOB_APPLIED_EVENT = void 0;
exports.JOB_APPLIED_EVENT = 'job.applied';
class JobAppliedEvent {
    applicationId;
    userId;
    jobId;
    cvId;
    recruiterId;
    jobTitle;
    eventType = exports.JOB_APPLIED_EVENT;
    occurredAt;
    constructor(applicationId, userId, jobId, cvId, recruiterId, jobTitle) {
        this.applicationId = applicationId;
        this.userId = userId;
        this.jobId = jobId;
        this.cvId = cvId;
        this.recruiterId = recruiterId;
        this.jobTitle = jobTitle;
        this.occurredAt = new Date();
    }
    toPayload() {
        return {
            eventType: this.eventType,
            applicationId: this.applicationId,
            userId: this.userId,
            jobId: this.jobId,
            cvId: this.cvId,
            recruiterId: this.recruiterId,
            jobTitle: this.jobTitle,
            occurredAt: this.occurredAt.toISOString(),
        };
    }
}
exports.JobAppliedEvent = JobAppliedEvent;
//# sourceMappingURL=job-applied.event.js.map