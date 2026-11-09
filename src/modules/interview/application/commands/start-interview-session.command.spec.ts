import {
  StartInterviewSessionCommand,
  StartInterviewSessionHandler,
} from './start-interview-session.command';
import {
  IInterviewReadRepository,
  InterviewListItem,
} from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import {
  InterviewAccessNotAllowedException,
  InterviewApplicationNotInterviewableException,
  InterviewNotActionableException,
  InterviewNotFoundException,
  InterviewSessionAlreadyOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

function makeItem(
  overrides: {
    status?: InterviewStatus;
    applicationStatus?: string;
  } = {},
): InterviewListItem {
  return {
    interview: new InterviewSchedule({
      id: 'interview-1',
      jobApplicationId: 'app-1',
      scheduledAt: new Date(Date.now() + 3600_000),
      location: 'Office',
      status: overrides.status,
    }),
    jobId: 'job-1',
    jobTitle: 'Backend Developer',
    candidateId: 'candidate-1',
    candidateName: 'Cand Idate',
    recruiterId: 'recruiter-1',
    applicationStatus: overrides.applicationStatus ?? 'INTERVIEW',
  };
}

describe('StartInterviewSessionHandler', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let handler: StartInterviewSessionHandler;

  beforeEach(() => {
    readRepository = { findItemById: jest.fn(), findForParticipant: jest.fn() };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest.fn().mockResolvedValue(null),
      save: jest.fn((s: InterviewSession) => Promise.resolve(s)),
      update: jest.fn(),
    };
    handler = new StartInterviewSessionHandler(
      readRepository,
      sessionRepository,
    );
  });

  it.each([
    ['candidate', 'candidate-1'],
    ['job-owning recruiter', 'recruiter-1'],
  ])('lets the %s start a session', async (_label, userId) => {
    readRepository.findItemById.mockResolvedValue(makeItem());

    const result = await handler.execute(
      new StartInterviewSessionCommand(userId, 'interview-1'),
    );

    expect(result.status).toBe('IN_PROGRESS');
    expect(result.interviewId).toBe('interview-1');
    expect(result.startedById).toBe(userId);
    expect(sessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects a user who is neither candidate nor job-owning recruiter', async () => {
    readRepository.findItemById.mockResolvedValue(makeItem());

    await expect(
      handler.execute(
        new StartInterviewSessionCommand('other-recruiter', 'interview-1'),
      ),
    ).rejects.toThrow(InterviewAccessNotAllowedException);
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('throws not-found for an unknown interview', async () => {
    readRepository.findItemById.mockResolvedValue(null);

    await expect(
      handler.execute(new StartInterviewSessionCommand('candidate-1', 'nope')),
    ).rejects.toThrow(InterviewNotFoundException);
  });

  it.each([
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.NO_SHOW,
  ])('rejects starting when the interview is %s', async (status) => {
    readRepository.findItemById.mockResolvedValue(makeItem({ status }));

    await expect(
      handler.execute(
        new StartInterviewSessionCommand('candidate-1', 'interview-1'),
      ),
    ).rejects.toThrow(InterviewNotActionableException);
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('allows starting a RESCHEDULED interview', async () => {
    readRepository.findItemById.mockResolvedValue(
      makeItem({ status: InterviewStatus.RESCHEDULED }),
    );

    await expect(
      handler.execute(
        new StartInterviewSessionCommand('candidate-1', 'interview-1'),
      ),
    ).resolves.toMatchObject({ status: 'IN_PROGRESS' });
  });

  it.each(['HIRED', 'REJECTED', 'WITHDRAWN'])(
    'rejects starting when the application is %s',
    async (applicationStatus) => {
      readRepository.findItemById.mockResolvedValue(
        makeItem({ applicationStatus }),
      );

      await expect(
        handler.execute(
          new StartInterviewSessionCommand('candidate-1', 'interview-1'),
        ),
      ).rejects.toThrow(InterviewApplicationNotInterviewableException);
    },
  );

  it('rejects a second start while a session is open', async () => {
    readRepository.findItemById.mockResolvedValue(makeItem());
    sessionRepository.findOpenByInterviewId.mockResolvedValue(
      new InterviewSession({ interviewId: 'interview-1' }),
    );

    await expect(
      handler.execute(
        new StartInterviewSessionCommand('candidate-1', 'interview-1'),
      ),
    ).rejects.toThrow(InterviewSessionAlreadyOpenException);
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('propagates the already-open error from a concurrent start caught by the DB index', async () => {
    readRepository.findItemById.mockResolvedValue(makeItem());
    sessionRepository.save.mockRejectedValue(
      new InterviewSessionAlreadyOpenException(),
    );

    await expect(
      handler.execute(
        new StartInterviewSessionCommand('candidate-1', 'interview-1'),
      ),
    ).rejects.toThrow(InterviewSessionAlreadyOpenException);
  });
});
