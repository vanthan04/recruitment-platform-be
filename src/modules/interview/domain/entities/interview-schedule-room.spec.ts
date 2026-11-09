import { InterviewSchedule } from './interview-schedule.entity';
import { InterviewLocationOrMeetingLinkRequiredException } from '@/modules/interview/domain/exceptions/interview.exceptions';

const inAnHour = () => new Date(Date.now() + 3600_000);

describe('InterviewSchedule — in-platform video room', () => {
  it('defaults useRoom to false', () => {
    const interview = new InterviewSchedule({
      scheduledAt: inAnHour(),
      location: 'Office',
    });
    expect(interview.useRoom).toBe(false);
  });

  it('accepts the room as the only "where"', () => {
    expect(
      () => new InterviewSchedule({ scheduledAt: inAnHour(), useRoom: true }),
    ).not.toThrow();
  });

  it('still requires some "where" when there is no room, link or location', () => {
    expect(() => new InterviewSchedule({ scheduledAt: inAnHour() })).toThrow(
      InterviewLocationOrMeetingLinkRequiredException,
    );
  });

  it('reschedule can switch the room on, and leaves it alone when not given', () => {
    const interview = new InterviewSchedule({
      scheduledAt: inAnHour(),
      location: 'Office',
    });

    interview.reschedule(
      inAnHour(),
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );
    expect(interview.useRoom).toBe(true);

    interview.reschedule(inAnHour());
    expect(interview.useRoom).toBe(true);
  });

  it('reschedule cannot remove the last "where"', () => {
    const interview = new InterviewSchedule({
      scheduledAt: inAnHour(),
      useRoom: true,
    });

    expect(() =>
      interview.reschedule(
        inAnHour(),
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      ),
    ).toThrow(InterviewLocationOrMeetingLinkRequiredException);
  });
});
