export const CV_UPLOADED_EVENT = 'cv.uploaded';

/**
 * Emitted after a CV file is durably saved (S3 + DB row). Consumed by the
 * `ai` module to trigger structured CV analysis asynchronously — this
 * module has no AI-related dependency itself and never awaits the listener.
 */
export class CvUploadedEvent {
  readonly eventType = CV_UPLOADED_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly cvId: string,
    public readonly userId: string,
  ) {
    this.occurredAt = new Date();
  }

  toPayload(): Record<string, any> {
    return {
      eventType: this.eventType,
      cvId: this.cvId,
      userId: this.userId,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
