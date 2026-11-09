import {
  RecordMonitoringConsentCommand,
  RecordMonitoringConsentHandler,
} from './record-monitoring-consent.command';
import {
  IInterviewReadRepository,
  InterviewListItem,
} from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import {
  InterviewAccessNotAllowedException,
  InterviewMonitoringNotAllowedException,
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

describe('RecordMonitoringConsentHandler', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let session: InterviewSession;
  let handler: RecordMonitoringConsentHandler;

  beforeEach(() => {
    session = new InterviewSession({
      id: 'session-1',
      interviewId: 'interview-1',
    });
    readRepository = {
      findItemById: jest.fn().mockResolvedValue(makeItem()),
      findForParticipant: jest.fn(),
    };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest.fn().mockResolvedValue(session),
      save: jest.fn(),
      update: jest.fn((s: InterviewSession) => Promise.resolve(s)),
    };
    handler = new RecordMonitoringConsentHandler(
      readRepository,
      sessionRepository,
    );
  });

  const run = (userId = 'candidate-1', version = 'v1') =>
    handler.execute(
      new RecordMonitoringConsentCommand(userId, 'interview-1', version),
    );

  it('records the candidate consent with the notice version on the open session', async () => {
    const result = await run();

    expect(result.sessionId).toBe('session-1');
    expect(result.noticeVersion).toBe('v1');
    expect(result.consentedAt).toBeInstanceOf(Date);
    expect(sessionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ monitoringNoticeVersion: 'v1' }),
    );
  });

  it('keeps the first consent when monitoring is started again in the same session', async () => {
    const first = new Date('2026-11-09T10:00:00Z');
    session.recordMonitoringConsent('v1', first);

    const result = await run('candidate-1', 'v2');

    expect(result).toMatchObject({ consentedAt: first, noticeVersion: 'v1' });
    expect(sessionRepository.update).not.toHaveBeenCalled();
  });

  it('refuses the recruiter — only candidates consent for their own camera', async () => {
    await expect(run('recruiter-1')).rejects.toThrow(
      InterviewMonitoringNotAllowedException,
    );
    expect(sessionRepository.update).not.toHaveBeenCalled();
  });

  it('refuses a non-participant', async () => {
    await expect(run('stranger')).rejects.toThrow(
      InterviewAccessNotAllowedException,
    );
  });

  it('refuses an interview that is not held in the platform room', async () => {
    readRepository.findItemById.mockResolvedValue(makeItem(false));
    await expect(run()).rejects.toThrow(InterviewRoomNotEnabledException);
  });

  it('refuses when no session is open', async () => {
    sessionRepository.findOpenByInterviewId.mockResolvedValue(null);
    await expect(run()).rejects.toThrow(InterviewSessionNotOpenException);
  });

  it('throws not-found for an unknown interview', async () => {
    readRepository.findItemById.mockResolvedValue(null);
    await expect(run()).rejects.toThrow(InterviewNotFoundException);
  });
});

describe('InterviewSession.recordMonitoringConsent', () => {
  it('cannot be recorded on an ended session', () => {
    const session = new InterviewSession({
      interviewId: 'i',
      endedAt: new Date(),
    });
    expect(() => session.recordMonitoringConsent('v1')).toThrow(
      InterviewSessionNotOpenException,
    );
  });
});
