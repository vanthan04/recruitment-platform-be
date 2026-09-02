import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

function makeInterview(overrides: Partial<InterviewSchedule> = {}): InterviewSchedule {
  return new InterviewSchedule({
    jobApplicationId: 'application-1',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: null,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    note: null,
    createdById: 'recruiter-1',
    ...overrides,
  });
}

describe('InterviewSchedule entity', () => {
  describe('constructor', () => {
    it('defaults to SCHEDULED status', () => {
      const interview = makeInterview();
      expect(interview.status).toBe(InterviewStatus.SCHEDULED);
    });

    it('throws when both location and meetingLink are missing', () => {
      expect(() => makeInterview({ location: null, meetingLink: null })).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('accepts a location-only (in-person) interview', () => {
      const interview = makeInterview({ location: '123 Main St', meetingLink: null });
      expect(interview.location).toBe('123 Main St');
    });
  });

  describe('reschedule', () => {
    it('updates scheduledAt and sets status to RESCHEDULED', () => {
      const interview = makeInterview();
      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      interview.reschedule(newDate);
      expect(interview.scheduledAt).toBe(newDate);
      expect(interview.status).toBe(InterviewStatus.RESCHEDULED);
    });

    it('throws when the new time is not in the future', () => {
      const interview = makeInterview();
      const pastDate = new Date(Date.now() - 1000);
      expect(() => interview.reschedule(pastDate)).toThrow(BusinessRuleViolationException);
    });

    it('throws when rescheduling a cancelled interview', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(() => interview.reschedule(new Date(Date.now() + 1000 * 60 * 60))).toThrow(
        BusinessRuleViolationException,
      );
    });
  });

  describe('cancel', () => {
    it('sets status to CANCELLED', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(interview.status).toBe(InterviewStatus.CANCELLED);
    });

    it('throws when cancelling an already-cancelled interview', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(() => interview.cancel()).toThrow(BusinessRuleViolationException);
    });
  });
});
