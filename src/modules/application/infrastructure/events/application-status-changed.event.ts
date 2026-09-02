export const APPLICATION_STATUS_CHANGED_EVENT = 'application.status_changed';

export class ApplicationStatusChangedEvent {
  readonly eventType = APPLICATION_STATUS_CHANGED_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly applicationId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly status: string,
  ) {
    this.occurredAt = new Date();
  }
}
