export declare class CvPublishedEvent {
    readonly cvId: string;
    readonly userId: string;
    readonly title: string;
    readonly eventType = "cv.published";
    readonly occurredAt: Date;
    constructor(cvId: string, userId: string, title: string);
    toPayload(): Record<string, any>;
}
