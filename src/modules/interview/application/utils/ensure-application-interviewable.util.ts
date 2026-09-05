import { InterviewApplicationNotInterviewableException } from '@/modules/interview/domain/exceptions/interview.exceptions';

// Kept as raw strings (not the `application` module's ApplicationStatus enum)
// on purpose — IInterviewApplicationLookupPort already types status as a
// loose `string` to avoid a cross-module domain-type import, so this guard
// stays consistent with that boundary.
const TERMINAL_APPLICATION_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN'];

export function ensureApplicationInterviewable(status: string): void {
  if (TERMINAL_APPLICATION_STATUSES.includes(status)) {
    throw new InterviewApplicationNotInterviewableException();
  }
}
