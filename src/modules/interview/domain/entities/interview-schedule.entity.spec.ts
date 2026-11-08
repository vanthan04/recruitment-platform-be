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

    it('throws when rescheduling a completed interview', () => {
      const interview = makeInterview();
      interview.complete();
      expect(() =>
        interview.reschedule(new Date(Date.now() + 1000 * 60 * 60)),
      ).toThrow(BusinessRuleViolationException);
    });

    it('throws when rescheduling a no-show interview', () => {
      const interview = makeInterview();
      interview.markNoShow();
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

    it('throws when cancelling a completed interview', () => {
      const interview = makeInterview();
      interview.complete();
      expect(() => interview.cancel()).toThrow(BusinessRuleViolationException);
    });

    it('throws when cancelling a no-show interview', () => {
      const interview = makeInterview();
      interview.markNoShow();
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

describe('InterviewSchedule reminders', () => {
  const HOUR = 60 * 60 * 1000;
  const START = new Date('2026-06-10T09:00:00.000Z');
  const hoursBeforeStart = (h: number) => new Date(START.getTime() - h * HOUR);

  /** An interview that starts at START and was set up `noticeHours` earlier. */
  const withNotice = (
    noticeHours: number,
    overrides: Partial<InterviewSchedule> = {},
  ) =>
    makeInterview({
      scheduledAt: START,
      updatedAt: hoursBeforeStart(noticeHours),
      ...overrides,
    });

  it('starts with no reminder sent', () => {
    expect(makeInterview().reminderSentAt).toBeNull();
  });

  describe('isReminderDue — plenty of notice (more than 24h)', () => {
    const interview = () => withNotice(72);

    it('is not due earlier than 24h before the start', () => {
      expect(interview().isReminderDue(hoursBeforeStart(25))).toBe(false);
    });

    it('is due from 24h before the start, up to the start', () => {
      expect(interview().isReminderDue(hoursBeforeStart(24))).toBe(true);
      expect(interview().isReminderDue(hoursBeforeStart(10))).toBe(true);
      expect(interview().isReminderDue(hoursBeforeStart(0.1))).toBe(true);
    });

    it('is never due once the interview has started', () => {
      expect(interview().isReminderDue(START)).toBe(false);
      expect(interview().isReminderDue(hoursBeforeStart(-1))).toBe(false);
    });
  });

  describe('isReminderDue — short notice (between 2h and 24h)', () => {
    // Set up 10h ahead: the 24h mark had already passed, so it falls back to 2h.
    const interview = () => withNotice(10);

    it('waits until 2h before the start', () => {
      expect(interview().isReminderDue(hoursBeforeStart(9))).toBe(false);
      expect(interview().isReminderDue(hoursBeforeStart(3))).toBe(false);
    });

    it('is due from 2h before the start', () => {
      expect(interview().isReminderDue(hoursBeforeStart(2))).toBe(true);
      expect(interview().isReminderDue(hoursBeforeStart(1))).toBe(true);
    });

    it('treats exactly 24h of notice as short notice (24h before is the moment it was booked)', () => {
      expect(withNotice(24).isReminderDue(hoursBeforeStart(10))).toBe(false);
      expect(withNotice(24).isReminderDue(hoursBeforeStart(2))).toBe(true);
    });
  });

  describe('isReminderDue — booked moments ago (2h of notice or less)', () => {
    it('never reminds: the booking email just went out', () => {
      const interview = withNotice(2);
      expect(interview.isReminderDue(hoursBeforeStart(2))).toBe(false);
      expect(interview.isReminderDue(hoursBeforeStart(1))).toBe(false);
      expect(withNotice(0.5).isReminderDue(hoursBeforeStart(0.25))).toBe(false);
    });

    it('does remind with just over 2h of notice', () => {
      expect(withNotice(2.5).isReminderDue(hoursBeforeStart(2))).toBe(true);
    });
  });

  describe('isReminderDue — other guards', () => {
    it('is not due once the reminder has been sent', () => {
      const interview = withNotice(72, {
        reminderSentAt: hoursBeforeStart(24),
      });
      expect(interview.isReminderDue(hoursBeforeStart(10))).toBe(false);
    });

    it.each([
      InterviewStatus.CANCELLED,
      InterviewStatus.COMPLETED,
      InterviewStatus.NO_SHOW,
    ])('is not due for a %s interview', (status) => {
      expect(
        withNotice(72, { status }).isReminderDue(hoursBeforeStart(10)),
      ).toBe(false);
    });

    it('is due for a RESCHEDULED interview', () => {
      const interview = withNotice(72, { status: InterviewStatus.RESCHEDULED });
      expect(interview.isReminderDue(hoursBeforeStart(10))).toBe(true);
    });
  });

  describe('reschedule', () => {
    it('clears the sent marker so the new time gets its own reminder', () => {
      const interview = makeInterview({
        reminderSentAt: new Date(),
        scheduledAt: new Date(Date.now() + 48 * HOUR),
      });

      interview.reschedule(new Date(Date.now() + 72 * HOUR));

      expect(interview.reminderSentAt).toBeNull();
    });

    it('does not touch the marker when the reschedule is refused', () => {
      const sentAt = new Date();
      const interview = makeInterview({
        status: InterviewStatus.CANCELLED,
        reminderSentAt: sentAt,
      });

      expect(() =>
        interview.reschedule(new Date(Date.now() + 72 * HOUR)),
      ).toThrow();
      expect(interview.reminderSentAt).toBe(sentAt);
    });
  });
});
