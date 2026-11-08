export const APPLICATION_WITHDRAWN_EVENT = 'application.withdrawn';

/**
 * Emitted after a candidate withdraws their own application.
 *
 * Separate from ApplicationStatusChangedEvent on purpose: that one means "a
 * recruiter moved the application" and drives a notification *to the
 * candidate*. Reusing it here would notify the candidate about their own
 * action and tell the recruiter nothing.
 */
export class ApplicationWithdrawnEvent {
  readonly eventType = APPLICATION_WITHDRAWN_EVENT;
  readonly occurredAt: Date;

  constructor(
    public readonly applicationId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
  ) {
    this.occurredAt = new Date();
  }
}
