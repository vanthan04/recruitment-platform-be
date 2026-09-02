export declare const APPLICATION_STATUS_CHANGED_EVENT = "application.status_changed";
export declare class ApplicationStatusChangedEvent {
    readonly applicationId: string;
    readonly candidateId: string;
    readonly jobId: string;
    readonly jobTitle: string;
    readonly status: string;
    readonly eventType = "application.status_changed";
    readonly occurredAt: Date;
    constructor(applicationId: string, candidateId: string, jobId: string, jobTitle: string, status: string);
}
