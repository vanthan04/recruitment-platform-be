"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvPublishedEvent = void 0;
class CvPublishedEvent {
    cvId;
    userId;
    title;
    eventType = 'cv.published';
    occurredAt;
    constructor(cvId, userId, title) {
        this.cvId = cvId;
        this.userId = userId;
        this.title = title;
        this.occurredAt = new Date();
    }
    toPayload() {
        return {
            eventType: this.eventType,
            cvId: this.cvId,
            userId: this.userId,
            title: this.title,
            occurredAt: this.occurredAt.toISOString(),
        };
    }
}
exports.CvPublishedEvent = CvPublishedEvent;
//# sourceMappingURL=cv-published.event.js.map