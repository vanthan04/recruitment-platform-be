import {
  SendInterviewRemindersCommand,
  SendInterviewRemindersHandler,
} from '@/modules/interview/application/commands/send-interview-reminders.command';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-06-10T09:00:00.000Z');
const inHours = (h: number) => new Date(NOW.getTime() + h * HOUR);

/** An interview starting `startsInHours` from NOW, set up well in advance unless `bookedHoursAgo` says otherwise. */
function makeInterview(
  overrides: Partial<InterviewSchedule> & {
    startsInHours?: number;
    bookedHoursAgo?: number;
  } = {},
): InterviewSchedule {
  const { startsInHours = 20, bookedHoursAgo = 72, ...rest } = overrides;
  return new InterviewSchedule({
    id: 'interview-1',
    jobApplicationId: 'app-1',
    scheduledAt: inHours(startsInHours),
    updatedAt: new Date(NOW.getTime() - bookedHoursAgo * HOUR),
    location: null,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    note: null,
    createdById: 'recruiter-1',
    ...rest,
  });
}

describe('SendInterviewRemindersHandler', () => {
  let handler: SendInterviewRemindersHandler;
  let interviewRepository: {
    findUnremindedStartingBetween: jest.Mock;
    claimReminder: jest.Mock;
  };
  let applicationLookupPort: { findById: jest.Mock };
  let jobLookupPort: { findById: jest.Mock };
  let userLookupPort: { findById: jest.Mock };
  let mailPort: { sendEmail: jest.Mock };

  const run = () => handler.execute(new SendInterviewRemindersCommand(NOW));

  beforeEach(() => {
    interviewRepository = {
      findUnremindedStartingBetween: jest.fn().mockResolvedValue([]),
      claimReminder: jest.fn().mockResolvedValue(true),
    };
    applicationLookupPort = {
      findById: jest.fn().mockResolvedValue({
        id: 'app-1',
        userId: 'candidate-1',
        jobId: 'job-1',
        status: 'INTERVIEW',
      }),
    };
    jobLookupPort = {
      findById: jest.fn().mockResolvedValue({
        id: 'job-1',
        title: 'Backend Engineer',
        postedById: 'recruiter-1',
      }),
    };
    userLookupPort = {
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(
          id === 'candidate-1'
            ? { id, email: 'candidate@example.com', fullName: 'Nguyễn Văn A' }
            : {
                id,
                email: 'recruiter@example.com',
                fullName: 'Recruiter One',
              },
        ),
      ),
    };
    mailPort = { sendEmail: jest.fn().mockResolvedValue(undefined) };

    handler = new SendInterviewRemindersHandler(
      interviewRepository as any,
      applicationLookupPort,
      jobLookupPort,
      userLookupPort,
      mailPort,
    );
  });

  it('scans the next 24 hours', async () => {
    await run();

    expect(
      interviewRepository.findUnremindedStartingBetween,
    ).toHaveBeenCalledWith(NOW, inHours(24), expect.any(Number));
  });

  it('does nothing when no interview is coming up', async () => {
    await expect(run()).resolves.toEqual({ considered: 0, reminded: 0 });
    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  describe('a due interview', () => {
    beforeEach(() => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview(),
      ]);
    });

    it('emails both the candidate and the recruiter', async () => {
      await expect(run()).resolves.toEqual({ considered: 1, reminded: 1 });

      const recipients = mailPort.sendEmail.mock.calls
        .map(([m]) => m.to)
        .sort();
      expect(recipients).toEqual([
        'candidate@example.com',
        'recruiter@example.com',
      ]);
    });

    it('tailors each email: the recruiter is told who the candidate is, the candidate is not', async () => {
      await run();

      const byRecipient = Object.fromEntries(
        mailPort.sendEmail.mock.calls.map(([m]) => [m.to, m]),
      );
      expect(byRecipient['recruiter@example.com'].html).toContain(
        'Nguyễn Văn A',
      );
      expect(byRecipient['candidate@example.com'].html).not.toContain(
        'Nguyễn Văn A',
      );
      expect(byRecipient['candidate@example.com'].subject).toBe(
        'Nhắc lịch phỏng vấn cho vị trí "Backend Engineer"',
      );
    });

    it('claims the reminder for exactly this interview and time, before sending', async () => {
      const order: string[] = [];
      interviewRepository.claimReminder.mockImplementation(() => {
        order.push('claim');
        return Promise.resolve(true);
      });
      mailPort.sendEmail.mockImplementation(() => {
        order.push('send');
        return Promise.resolve();
      });

      await run();

      expect(interviewRepository.claimReminder).toHaveBeenCalledWith(
        'interview-1',
        inHours(20),
        NOW,
      );
      expect(order[0]).toBe('claim');
    });

    it('sends nothing when another instance already claimed it', async () => {
      interviewRepository.claimReminder.mockResolvedValue(false);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
      expect(mailPort.sendEmail).not.toHaveBeenCalled();
    });

    it("still reminds the candidate when the recruiter's email fails (and vice versa)", async () => {
      mailPort.sendEmail.mockImplementation(({ to }: { to: string }) =>
        to === 'recruiter@example.com'
          ? Promise.reject(new Error('smtp down'))
          : Promise.resolve(),
      );

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 1 });
      expect(mailPort.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('reminds the one who exists if the other user has been deleted', async () => {
      userLookupPort.findById.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'candidate-1'
            ? { id, email: 'candidate@example.com', fullName: 'Nguyễn Văn A' }
            : null,
        ),
      );

      await run();

      expect(mailPort.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailPort.sendEmail.mock.calls[0][0].to).toBe(
        'candidate@example.com',
      );
    });

    it('does not claim (or send) when neither person can be found', async () => {
      userLookupPort.findById.mockResolvedValue(null);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
      expect(interviewRepository.claimReminder).not.toHaveBeenCalled();
    });
  });

  describe('interviews that are not due or not valid', () => {
    it('skips a short-notice interview that is not at its 2h mark yet', async () => {
      // Booked an hour ago for 9h from now → 10h of notice → no 24h mark, so
      // the reminder waits until 2h before the start.
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ startsInHours: 9, bookedHoursAgo: 1 }),
      ]);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
      expect(interviewRepository.claimReminder).not.toHaveBeenCalled();
    });

    it('skips one booked moments ago — the booking email just went out', async () => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ startsInHours: 1, bookedHoursAgo: 0.5 }),
      ]);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
      expect(mailPort.sendEmail).not.toHaveBeenCalled();
    });

    it('sends the 2h reminder for a late booking once it is 2h out', async () => {
      // Set up 5h before start; it is now 2h before start.
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ startsInHours: 2, bookedHoursAgo: 3 }),
      ]);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 1 });
    });

    it.each(['HIRED', 'REJECTED', 'WITHDRAWN'])(
      'skips an interview whose application is now %s, without claiming it',
      async (status) => {
        interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
          makeInterview(),
        ]);
        applicationLookupPort.findById.mockResolvedValue({
          id: 'app-1',
          userId: 'candidate-1',
          jobId: 'job-1',
          status,
        });

        await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
        expect(interviewRepository.claimReminder).not.toHaveBeenCalled();
        expect(mailPort.sendEmail).not.toHaveBeenCalled();
      },
    );

    it('skips an interview whose application or job no longer exists', async () => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview(),
      ]);
      applicationLookupPort.findById.mockResolvedValue(null);
      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });

      applicationLookupPort.findById.mockResolvedValue({
        id: 'app-1',
        userId: 'candidate-1',
        jobId: 'job-1',
        status: 'INTERVIEW',
      });
      jobLookupPort.findById.mockResolvedValue(null);
      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });

      expect(interviewRepository.claimReminder).not.toHaveBeenCalled();
    });

    it('skips a cancelled interview even if the repository returned it', async () => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ status: InterviewStatus.CANCELLED }),
      ]);

      await expect(run()).resolves.toEqual({ considered: 1, reminded: 0 });
    });
  });

  describe('a batch', () => {
    it('keeps going after one interview fails, and reports only the ones reminded', async () => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ id: 'broken', jobApplicationId: 'app-broken' }),
        makeInterview({ id: 'fine', jobApplicationId: 'app-1' }),
      ]);
      applicationLookupPort.findById.mockImplementation((id: string) =>
        id === 'app-broken'
          ? Promise.reject(new Error('db hiccup'))
          : Promise.resolve({
              id,
              userId: 'candidate-1',
              jobId: 'job-1',
              status: 'INTERVIEW',
            }),
      );

      await expect(run()).resolves.toEqual({ considered: 2, reminded: 1 });
      expect(interviewRepository.claimReminder).toHaveBeenCalledTimes(1);
      expect(interviewRepository.claimReminder.mock.calls[0][0]).toBe('fine');
    });

    it('reminds each interview in the batch', async () => {
      interviewRepository.findUnremindedStartingBetween.mockResolvedValue([
        makeInterview({ id: 'a' }),
        makeInterview({ id: 'b' }),
        makeInterview({ id: 'c' }),
      ]);

      await expect(run()).resolves.toEqual({ considered: 3, reminded: 3 });
      expect(mailPort.sendEmail).toHaveBeenCalledTimes(6);
    });
  });
});
