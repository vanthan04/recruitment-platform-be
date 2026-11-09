import { InterviewSession } from './interview-session.entity';
import { InterviewSessionAlreadyEndedException } from '@/modules/interview/domain/exceptions/interview.exceptions';

describe('InterviewSession', () => {
  it('starts open, with startedAt defaulting to now', () => {
    const before = Date.now();
    const session = new InterviewSession({ interviewId: 'i-1' });

    expect(session.isOpen()).toBe(true);
    expect(session.endedAt).toBeNull();
    expect(session.startedById).toBeNull();
    expect(session.startedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('end() closes the session at the given time', () => {
    const session = new InterviewSession({ interviewId: 'i-1' });
    const at = new Date('2026-11-09T10:00:00Z');

    session.end(at);

    expect(session.isOpen()).toBe(false);
    expect(session.endedAt).toEqual(at);
  });

  it('end() on an already-ended session throws and keeps the original end time', () => {
    const first = new Date('2026-11-09T10:00:00Z');
    const session = new InterviewSession({
      interviewId: 'i-1',
      endedAt: first,
    });

    expect(() => session.end(new Date())).toThrow(
      InterviewSessionAlreadyEndedException,
    );
    expect(session.endedAt).toEqual(first);
  });
});
