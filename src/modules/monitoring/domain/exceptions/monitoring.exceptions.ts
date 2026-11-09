import {
  EntityNotFoundException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

export class MonitoringInterviewNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('InterviewSchedule', id, 'INTERVIEW_NOT_FOUND');
    this.name = 'MonitoringInterviewNotFoundException';
  }
}

export class MonitoringAccessNotAllowedException extends UnauthorizedDomainException {
  constructor() {
    super(
      'You are not a participant of this interview',
      'INTERVIEW_ACCESS_NOT_ALLOWED',
    );
    this.name = 'MonitoringAccessNotAllowedException';
  }
}

export class DetectionEventNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('DetectionEvent', id, 'DETECTION_EVENT_NOT_FOUND');
    this.name = 'DetectionEventNotFoundException';
  }
}

/** Reviewing is a recruiter's judgement call — candidates can read, not review. */
export class DetectionEventReviewNotAllowedException extends UnauthorizedDomainException {
  constructor() {
    super(
      'Only the recruiter of this job can review monitoring events',
      'DETECTION_EVENT_REVIEW_NOT_ALLOWED',
    );
    this.name = 'DetectionEventReviewNotAllowedException';
  }
}
