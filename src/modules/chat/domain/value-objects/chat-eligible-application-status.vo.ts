/**
 * Application statuses at which a recruiter may open (or resume) a
 * conversation with the candidate: from the moment they are shortlisted
 * through to being hired.
 *
 * Deliberately excluded:
 * - APPLIED / SCREENING — the recruiter hasn't committed to the candidate
 *   yet, and opening a chat then would let any applicant be messaged
 *   straight from the inbox.
 * - REJECTED / WITHDRAWN — the process is over; no new conversation starts.
 *   (One that already exists is not closed by this — see
 *   CreateMessageHandler, which only checks membership.)
 *
 * Plain strings rather than the application module's `ApplicationStatus`
 * enum: chat reads applications through IChatApplicationLookupPort, whose
 * `status` is a string, and modules don't import each other's domain.
 * Keep in step with `ApplicationStatus` (application-status.vo.ts).
 */
export const CHAT_ELIGIBLE_APPLICATION_STATUSES: readonly string[] = [
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
];

export function isChatEligibleApplicationStatus(status: string): boolean {
  return CHAT_ELIGIBLE_APPLICATION_STATUSES.includes(status);
}

/**
 * Statuses at which an existing conversation becomes read-only: the hiring
 * process ended without a hire. History stays readable and messages can
 * still be deleted by their sender (taking something back is never the
 * abuse this guards against), but nobody can send or edit.
 *
 * HIRED is *not* closed — the recruiter and the new hire still have things
 * to sort out. Same string-copy caveat as above.
 */
export const CHAT_CLOSED_APPLICATION_STATUSES: readonly string[] = [
  'REJECTED',
  'WITHDRAWN',
];

export function isChatClosedApplicationStatus(status: string): boolean {
  return CHAT_CLOSED_APPLICATION_STATUSES.includes(status);
}
