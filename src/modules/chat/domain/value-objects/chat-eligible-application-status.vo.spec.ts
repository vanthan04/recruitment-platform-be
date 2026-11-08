import {
  CHAT_CLOSED_APPLICATION_STATUSES,
  CHAT_ELIGIBLE_APPLICATION_STATUSES,
  isChatClosedApplicationStatus,
  isChatEligibleApplicationStatus,
} from '@/modules/chat/domain/value-objects/chat-eligible-application-status.vo';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

describe('isChatEligibleApplicationStatus', () => {
  it.each(['SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'])(
    'allows %s',
    (status) => {
      expect(isChatEligibleApplicationStatus(status)).toBe(true);
    },
  );

  it.each(['APPLIED', 'SCREENING', 'REJECTED', 'WITHDRAWN', '', 'unknown'])(
    'refuses %p',
    (status) => {
      expect(isChatEligibleApplicationStatus(status)).toBe(false);
    },
  );

  // The chat module keeps its own string copy of the statuses (modules don't
  // import each other's domain in production code) — this test, which may
  // look across modules, is what keeps that copy from drifting if the
  // pipeline is ever renamed or extended.
  it('only names statuses that exist in the application pipeline', () => {
    const known = Object.values(ApplicationStatus) as string[];
    for (const status of CHAT_ELIGIBLE_APPLICATION_STATUSES) {
      expect(known).toContain(status);
    }
  });
});

describe('isChatClosedApplicationStatus', () => {
  it.each(['REJECTED', 'WITHDRAWN'])('closes on %s', (status) => {
    expect(isChatClosedApplicationStatus(status)).toBe(true);
  });

  it.each([
    'APPLIED',
    'SCREENING',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFER',
    'HIRED',
  ])('stays open on %s', (status) => {
    expect(isChatClosedApplicationStatus(status)).toBe(false);
  });

  it('names only real pipeline statuses, none of which is also eligible to start a chat', () => {
    const known = Object.values(ApplicationStatus) as string[];
    for (const status of CHAT_CLOSED_APPLICATION_STATUSES) {
      expect(known).toContain(status);
      expect(CHAT_ELIGIBLE_APPLICATION_STATUSES).not.toContain(status);
    }
  });
});
