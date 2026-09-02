export declare const JOB_APPLIED_EVENT = "job.applied";
export declare class JobAppliedEvent {
    readonly applicationId: string;
    readonly userId: string;
    readonly jobId: string;
    readonly cvId: string;
    readonly recruiterId: string;
    readonly jobTitle: string;
    readonly eventType = "job.applied";
    readonly occurredAt: Date;
    constructor(applicationId: string, userId: string, jobId: string, cvId: string, recruiterId: string, jobTitle: string);
    toPayload(): Record<string, any>;
}
