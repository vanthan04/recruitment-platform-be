export class JobAppliedEvent {
  readonly eventType = 'job.applied';
  readonly occurredAt: Date;

  constructor(
    public readonly applicationId: string,
    public readonly userId: string,
    public readonly jobId: string,
    public readonly cvId: string,
  ) {
    this.occurredAt = new Date();
  }

  toPayload(): Record<string, any> {
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
