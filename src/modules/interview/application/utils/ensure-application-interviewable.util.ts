import { InterviewApplicationNotInterviewableException } from '@/modules/interview/domain/exceptions/interview.exceptions';

// Kept as raw strings (not the `application` module's ApplicationStatus enum)
// on purpose — IInterviewApplicationLookupPort already types status as a
// loose `string` to avoid a cross-module domain-type import, so this guard
// stays consistent with that boundary.
const TERMINAL_APPLICATION_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN'];

/** Whether an application in this status can still have an interview scheduled — and so still be reminded about one. */
export function isApplicationInterviewable(status: string): boolean {
  return !TERMINAL_APPLICATION_STATUSES.includes(status);
}

export function ensureApplicationInterviewable(status: string): void {
  if (!isApplicationInterviewable(status)) {
    throw new InterviewApplicationNotInterviewableException();
  }
}
