export const JOB_APPLIED_EVENT = 'job.applied';

export class JobAppliedEvent {
  readonly eventType = JOB_APPLIED_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly applicationId: string,
    public readonly userId: string,
    public readonly jobId: string,
    public readonly cvId: string,
    public readonly recruiterId: string,
    public readonly jobTitle: string,
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
      recruiterId: this.recruiterId,
      jobTitle: this.jobTitle,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
