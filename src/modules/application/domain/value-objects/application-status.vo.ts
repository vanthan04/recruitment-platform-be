export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * Recruiter-driven forward pipeline. REJECTED is reachable from any
 * non-terminal step (a candidate can be rejected at any stage); WITHDRAWN
 * is candidate-driven and handled separately (see JobApplication.withdraw),
 * not part of this recruiter-facing transition map.
 */
const FORWARD_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [
    ApplicationStatus.SCREENING,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SCREENING]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.OFFER]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

export function isTerminalApplicationStatus(
  status: ApplicationStatus,
): boolean {
  return FORWARD_TRANSITIONS[status].length === 0;
}

export function canTransitionApplicationStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return FORWARD_TRANSITIONS[from].includes(to);
}
