"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAppliedEvent = void 0;
class JobAppliedEvent {
    applicationId;
    userId;
    jobId;
    cvId;
    eventType = 'job.applied';
    occurredAt;
    constructor(applicationId, userId, jobId, cvId) {
        this.applicationId = applicationId;
        this.userId = userId;
        this.jobId = jobId;
        this.cvId = cvId;
        this.occurredAt = new Date();
    }
    toPayload() {
        return {
            eventType: this.eventType,
            applicationId: this.applicationId,
            userId: this.userId,
            jobId: this.jobId,
            cvId: this.cvId,
            occurredAt: this.occurredAt.toISOString(),
        };
    }
}
exports.JobAppliedEvent = JobAppliedEvent;
//# sourceMappingURL=job-applied.event.js.map