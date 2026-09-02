"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatusChangedEvent = exports.APPLICATION_STATUS_CHANGED_EVENT = void 0;
exports.APPLICATION_STATUS_CHANGED_EVENT = 'application.status_changed';
class ApplicationStatusChangedEvent {
    applicationId;
    candidateId;
    jobId;
    jobTitle;
    status;
    eventType = exports.APPLICATION_STATUS_CHANGED_EVENT;
    occurredAt;
    constructor(applicationId, candidateId, jobId, jobTitle, status) {
        this.applicationId = applicationId;
        this.candidateId = candidateId;
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.status = status;
        this.occurredAt = new Date();
    }
}
exports.ApplicationStatusChangedEvent = ApplicationStatusChangedEvent;
//# sourceMappingURL=application-status-changed.event.js.map