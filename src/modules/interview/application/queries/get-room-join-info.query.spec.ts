import {
  GetRoomJoinInfoHandler,
  GetRoomJoinInfoQuery,
} from './get-room-join-info.query';
import {
  IInterviewReadRepository,
  InterviewListItem,
} from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { IInterviewRoomProvider } from '@/modules/interview/application/ports/interview-room-provider.port';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import {
  InterviewAccessNotAllowedException,
  InterviewNotFoundException,
  InterviewRoomNotEnabledException,
  InterviewSessionNotOpenException,
} from '@/modules/interview/domain/exceptions/interview.exceptions';

function makeItem(useRoom = true): InterviewListItem {
  return {
    interview: new InterviewSchedule({
      id: 'interview-1',
      jobApplicationId: 'app-1',
      scheduledAt: new Date(Date.now() + 3600_000),
      useRoom,
      location: useRoom ? undefined : 'Office',
    }),
    jobId: 'job-1',
    jobTitle: 'Backend Developer',
    candidateId: 'candidate-1',
    candidateName: null,
    recruiterId: 'recruiter-1',
    applicationStatus: 'INTERVIEW',
  };
}

describe('GetRoomJoinInfoHandler', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let provider: jest.Mocked<IInterviewRoomProvider>;
  let handler: GetRoomJoinInfoHandler;

  beforeEach(() => {
    readRepository = {
      findItemById: jest.fn().mockResolvedValue(makeItem()),
      findForParticipant: jest.fn(),
    };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest
        .fn()
        .mockResolvedValue(
          new InterviewSession({ id: 'session-1', interviewId: 'interview-1' }),
        ),
      save: jest.fn(),
      update: jest.fn(),
    };
    provider = {
      issueJoinInfo: jest
        .fn()
        .mockResolvedValue({ provider: 'p2p', iceServers: [] }),
    };
    handler = new GetRoomJoinInfoHandler(
      readRepository,
      sessionRepository,
      provider,
    );
  });

  it.each([
    ['candidate', 'candidate-1', 'CANDIDATE'],
    ['recruiter', 'recruiter-1', 'RECRUITER'],
  ])('issues join info to the %s', async (_label, userId, role) => {
    const result = await handler.execute(
      new GetRoomJoinInfoQuery(userId, 'interview-1'),
    );

    expect(result).toEqual({
      sessionId: 'session-1',
      join: { provider: 'p2p', iceServers: [] },
    });
    expect(provider.issueJoinInfo).toHaveBeenCalledWith({
      interviewId: 'interview-1',
      userId,
      role,
    });
  });

  it('rejects a non-participant without issuing anything', async () => {
    await expect(
      handler.execute(new GetRoomJoinInfoQuery('stranger', 'interview-1')),
    ).rejects.toThrow(InterviewAccessNotAllowedException);
    expect(provider.issueJoinInfo).not.toHaveBeenCalled();
  });

  it('throws not-found for an unknown interview', async () => {
    readRepository.findItemById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetRoomJoinInfoQuery('candidate-1', 'nope')),
    ).rejects.toThrow(InterviewNotFoundException);
  });

  it('rejects an interview that does not use the room', async () => {
    readRepository.findItemById.mockResolvedValue(makeItem(false));

    await expect(
      handler.execute(new GetRoomJoinInfoQuery('candidate-1', 'interview-1')),
    ).rejects.toThrow(InterviewRoomNotEnabledException);
    expect(provider.issueJoinInfo).not.toHaveBeenCalled();
  });

  it('rejects while no session is open', async () => {
    sessionRepository.findOpenByInterviewId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetRoomJoinInfoQuery('candidate-1', 'interview-1')),
    ).rejects.toThrow(InterviewSessionNotOpenException);
    expect(provider.issueJoinInfo).not.toHaveBeenCalled();
  });
});
