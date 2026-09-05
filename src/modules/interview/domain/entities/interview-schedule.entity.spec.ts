import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

function makeInterview(
  overrides: Partial<InterviewSchedule> = {},
): InterviewSchedule {
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
      expect(() =>
        makeInterview({ location: null, meetingLink: null }),
      ).toThrow(BusinessRuleViolationException);
    });

    it('accepts a location-only (in-person) interview', () => {
      const interview = makeInterview({
        location: '123 Main St',
        meetingLink: null,
      });
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
      expect(() => interview.reschedule(pastDate)).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('throws when rescheduling a cancelled interview', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(() =>
        interview.reschedule(new Date(Date.now() + 1000 * 60 * 60)),
      ).toThrow(BusinessRuleViolationException);
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

  describe('complete', () => {
    it('sets status to COMPLETED from SCHEDULED', () => {
      const interview = makeInterview();
      interview.complete();
      expect(interview.status).toBe(InterviewStatus.COMPLETED);
    });

    it('sets status to COMPLETED from RESCHEDULED', () => {
      const interview = makeInterview({ status: InterviewStatus.RESCHEDULED });
      interview.complete();
      expect(interview.status).toBe(InterviewStatus.COMPLETED);
    });

    it('throws when completing a cancelled interview', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(() => interview.complete()).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('throws when completing an already-completed interview', () => {
      const interview = makeInterview();
      interview.complete();
      expect(() => interview.complete()).toThrow(
        BusinessRuleViolationException,
      );
    });
  });

  describe('markNoShow', () => {
    it('sets status to NO_SHOW from SCHEDULED', () => {
      const interview = makeInterview();
      interview.markNoShow();
      expect(interview.status).toBe(InterviewStatus.NO_SHOW);
    });

    it('throws when marking a cancelled interview as no-show', () => {
      const interview = makeInterview();
      interview.cancel();
      expect(() => interview.markNoShow()).toThrow(
        BusinessRuleViolationException,
      );
    });
  });

  describe('durationMinutes', () => {
    it('defaults to null', () => {
      const interview = makeInterview();
      expect(interview.durationMinutes).toBeNull();
    });

    it('is settable via the constructor', () => {
      const interview = makeInterview({ durationMinutes: 45 });
      expect(interview.durationMinutes).toBe(45);
    });

    it('is updatable via reschedule', () => {
      const interview = makeInterview({ durationMinutes: 30 });
      interview.reschedule(
        new Date(Date.now() + 1000 * 60 * 60),
        undefined,
        undefined,
        undefined,
        60,
      );
      expect(interview.durationMinutes).toBe(60);
    });
  });
});
