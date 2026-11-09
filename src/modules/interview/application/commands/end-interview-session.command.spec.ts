import {
  EndInterviewSessionCommand,
  EndInterviewSessionHandler,
} from './end-interview-session.command';
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
  InterviewNotFoundException,
  InterviewSessionAlreadyEndedException,
  InterviewSessionNotFoundException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

function makeItem(status = InterviewStatus.SCHEDULED): InterviewListItem {
  return {
    interview: new InterviewSchedule({
      id: 'interview-1',
      jobApplicationId: 'app-1',
      scheduledAt: new Date(Date.now() + 3600_000),
      location: 'Office',
      status,
    }),
    jobId: 'job-1',
    jobTitle: 'Backend Developer',
    candidateId: 'candidate-1',
    candidateName: null,
    recruiterId: 'recruiter-1',
    applicationStatus: 'INTERVIEW',
  };
}

describe('EndInterviewSessionHandler', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let handler: EndInterviewSessionHandler;

  beforeEach(() => {
    readRepository = {
      findItemById: jest.fn().mockResolvedValue(makeItem()),
      findForParticipant: jest.fn(),
    };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest.fn(),
      save: jest.fn(),
      update: jest.fn((s: InterviewSession) => Promise.resolve(s)),
    };
    handler = new EndInterviewSessionHandler(readRepository, sessionRepository);
  });

  const openSession = () =>
    new InterviewSession({ id: 'session-1', interviewId: 'interview-1' });

  it.each([
    ['candidate', 'candidate-1'],
    ['job-owning recruiter', 'recruiter-1'],
  ])('lets the %s end an open session', async (_label, userId) => {
    sessionRepository.findById.mockResolvedValue(openSession());

    const result = await handler.execute(
      new EndInterviewSessionCommand(userId, 'interview-1', 'session-1'),
    );

    expect(result.status).toBe('ENDED');
    expect(result.endedAt).toBeInstanceOf(Date);
    expect(sessionRepository.update).toHaveBeenCalledTimes(1);
  });

  it('can still end a stale session after the interview has finished', async () => {
    readRepository.findItemById.mockResolvedValue(
      makeItem(InterviewStatus.COMPLETED),
    );
    sessionRepository.findById.mockResolvedValue(openSession());

    await expect(
      handler.execute(
        new EndInterviewSessionCommand(
          'recruiter-1',
          'interview-1',
          'session-1',
        ),
      ),
    ).resolves.toMatchObject({ status: 'ENDED' });
  });

  it('rejects a non-participant before looking at the session', async () => {
    await expect(
      handler.execute(
        new EndInterviewSessionCommand('stranger', 'interview-1', 'session-1'),
      ),
    ).rejects.toThrow(InterviewAccessNotAllowedException);
    expect(sessionRepository.findById).not.toHaveBeenCalled();
  });

  it('throws not-found for an unknown interview', async () => {
    readRepository.findItemById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new EndInterviewSessionCommand('candidate-1', 'nope', 'session-1'),
      ),
    ).rejects.toThrow(InterviewNotFoundException);
  });

  it('treats a session belonging to another interview as not found', async () => {
    sessionRepository.findById.mockResolvedValue(
      new InterviewSession({ id: 'session-1', interviewId: 'other-interview' }),
    );

    await expect(
      handler.execute(
        new EndInterviewSessionCommand(
          'candidate-1',
          'interview-1',
          'session-1',
        ),
      ),
    ).rejects.toThrow(InterviewSessionNotFoundException);
    expect(sessionRepository.update).not.toHaveBeenCalled();
  });

  it('throws not-found for an unknown session', async () => {
    sessionRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new EndInterviewSessionCommand('candidate-1', 'interview-1', 'nope'),
      ),
    ).rejects.toThrow(InterviewSessionNotFoundException);
  });

  it('rejects ending a session that already ended', async () => {
    sessionRepository.findById.mockResolvedValue(
      new InterviewSession({
        id: 'session-1',
        interviewId: 'interview-1',
        endedAt: new Date(),
      }),
    );

    await expect(
      handler.execute(
        new EndInterviewSessionCommand(
          'candidate-1',
          'interview-1',
          'session-1',
        ),
      ),
    ).rejects.toThrow(InterviewSessionAlreadyEndedException);
    expect(sessionRepository.update).not.toHaveBeenCalled();
  });
});
