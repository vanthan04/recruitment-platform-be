import { GetInterviewHandler, GetInterviewQuery } from './get-interview.query';
import {
  ListMyInterviewsHandler,
  ListMyInterviewsQuery,
} from './list-my-interviews.query';
import {
  ListInterviewSessionsHandler,
  ListInterviewSessionsQuery,
} from './list-interview-sessions.query';
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
} from '@/modules/interview/domain/exceptions/interview.exceptions';

function makeItem(id = 'interview-1'): InterviewListItem {
  return {
    interview: new InterviewSchedule({
      id,
      jobApplicationId: 'app-1',
      scheduledAt: new Date(Date.now() + 3600_000),
      location: 'Office',
    }),
    jobId: 'job-1',
    jobTitle: 'Backend Developer',
    candidateId: 'candidate-1',
    candidateName: 'Cand Idate',
    recruiterId: 'recruiter-1',
    applicationStatus: 'INTERVIEW',
  };
}

describe('interview read queries', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;

  beforeEach(() => {
    readRepository = { findItemById: jest.fn(), findForParticipant: jest.fn() };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
  });

  describe('GetInterviewHandler', () => {
    const handler = () => new GetInterviewHandler(readRepository);

    it('returns the interview with the requester role (candidate)', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem());

      const result = await handler().execute(
        new GetInterviewQuery('candidate-1', 'interview-1'),
      );

      expect(result).toMatchObject({
        id: 'interview-1',
        jobTitle: 'Backend Developer',
        candidateName: 'Cand Idate',
        viewerRole: 'CANDIDATE',
      });
    });

    it('returns the requester role RECRUITER for the job owner', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem());

      const result = await handler().execute(
        new GetInterviewQuery('recruiter-1', 'interview-1'),
      );

      expect(result.viewerRole).toBe('RECRUITER');
    });

    it('rejects a different recruiter or candidate', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem());

      await expect(
        handler().execute(new GetInterviewQuery('recruiter-2', 'interview-1')),
      ).rejects.toThrow(InterviewAccessNotAllowedException);
    });

    it('throws not-found for an unknown interview', async () => {
      readRepository.findItemById.mockResolvedValue(null);

      await expect(
        handler().execute(new GetInterviewQuery('candidate-1', 'nope')),
      ).rejects.toThrow(InterviewNotFoundException);
    });
  });

  describe('ListMyInterviewsHandler', () => {
    it('passes filters through and maps role + pagination', async () => {
      readRepository.findForParticipant.mockResolvedValue({
        items: [makeItem('i-1'), makeItem('i-2')],
        total: 7,
      });

      const result = await new ListMyInterviewsHandler(readRepository).execute(
        new ListMyInterviewsQuery(
          'candidate-1',
          2,
          2,
          InterviewStatus.SCHEDULED,
          true,
        ),
      );

      expect(readRepository.findForParticipant).toHaveBeenCalledWith({
        userId: 'candidate-1',
        status: InterviewStatus.SCHEDULED,
        upcoming: true,
        page: 2,
        limit: 2,
      });
      expect(result.total).toBe(7);
      expect(result.page).toBe(2);
      expect(result.interviews.map((i) => i.viewerRole)).toEqual([
        'CANDIDATE',
        'CANDIDATE',
      ]);
    });
  });

  describe('ListInterviewSessionsHandler', () => {
    const handler = () =>
      new ListInterviewSessionsHandler(readRepository, sessionRepository);

    it('returns sessions for a participant', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem());
      sessionRepository.findByInterviewId.mockResolvedValue([
        new InterviewSession({ interviewId: 'interview-1' }),
        new InterviewSession({
          interviewId: 'interview-1',
          endedAt: new Date(),
        }),
      ]);

      const result = await handler().execute(
        new ListInterviewSessionsQuery('recruiter-1', 'interview-1'),
      );

      expect(result.map((s) => s.status)).toEqual(['IN_PROGRESS', 'ENDED']);
    });

    it('rejects a non-participant without touching the sessions', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem());

      await expect(
        handler().execute(
          new ListInterviewSessionsQuery('stranger', 'interview-1'),
        ),
      ).rejects.toThrow(InterviewAccessNotAllowedException);
      expect(sessionRepository.findByInterviewId).not.toHaveBeenCalled();
    });
  });
});
