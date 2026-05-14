/**
 * Kafka-ready event structure for when a CV is published.
 * Can be emitted to a message broker for downstream consumers.
 */
export class CvPublishedEvent {
  readonly eventType = 'cv.published';
  readonly occurredAt: Date;

  constructor(
    public readonly cvId: string,
    public readonly userId: string,
    public readonly title: string,
  ) {
    this.occurredAt = new Date();
  }

  toPayload(): Record<string, any> {
    return {
      eventType: this.eventType,
      cvId: this.cvId,
      userId: this.userId,
      title: this.title,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
