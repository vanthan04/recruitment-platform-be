import {
  EntityNotFoundException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Interview-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class InterviewNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('InterviewSchedule', id, 'INTERVIEW_NOT_FOUND');
    this.name = 'InterviewNotFoundException';
  }
}

/** The JobApplication an interview/scheduling request refers to. */
export class InterviewApplicationNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Application', id, 'INTERVIEW_APPLICATION_NOT_FOUND');
    this.name = 'InterviewApplicationNotFoundException';
  }
}

/** The Job the referenced application belongs to. */
export class InterviewJobNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Job', id, 'INTERVIEW_JOB_NOT_FOUND');
    this.name = 'InterviewJobNotFoundException';
  }
}

export class InterviewViewNotAllowedException extends UnauthorizedDomainException {
  constructor() {
    super(
      'You are not allowed to view interviews for this application',
      'INTERVIEW_VIEW_NOT_ALLOWED',
    );
    this.name = 'InterviewViewNotAllowedException';
  }
}

export class InterviewAlreadyCancelledException extends BusinessRuleViolationException {
  constructor() {
    super('Interview is already cancelled', 'INTERVIEW_ALREADY_CANCELLED');
    this.name = 'InterviewAlreadyCancelledException';
  }
}

export class CannotRescheduleCancelledInterviewException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Cannot reschedule a cancelled interview',
      'INTERVIEW_CANNOT_RESCHEDULE_CANCELLED',
    );
    this.name = 'CannotRescheduleCancelledInterviewException';
  }
}

export class InterviewTimeInPastException extends BusinessRuleViolationException {
  constructor() {
    super('Interview time must be in the future', 'INTERVIEW_TIME_IN_PAST');
    this.name = 'InterviewTimeInPastException';
  }
}

export class InterviewLocationOrMeetingLinkRequiredException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Either location or meetingLink must be provided',
      'INTERVIEW_LOCATION_OR_LINK_REQUIRED',
    );
    this.name = 'InterviewLocationOrMeetingLinkRequiredException';
  }
}
