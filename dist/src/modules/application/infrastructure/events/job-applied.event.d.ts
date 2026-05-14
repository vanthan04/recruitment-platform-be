export declare class JobAppliedEvent {
    readonly applicationId: string;
    readonly userId: string;
    readonly jobId: string;
    readonly cvId: string;
    readonly eventType = "job.applied";
    readonly occurredAt: Date;
    constructor(applicationId: string, userId: string, jobId: string, cvId: string);
    toPayload(): Record<string, any>;
}
