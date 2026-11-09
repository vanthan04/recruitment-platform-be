import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InterviewSessionInfraRepository } from './interview-session.infra-repository';
import { InterviewSessionPrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-session-prisma.repository';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewSessionAlreadyOpenException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import {
  INTERVIEW_ROOM_CLOSED_EVENT,
  InterviewRoomClosedEvent,
} from '@/modules/interview/infrastructure/events/interview-room-closed.event';

// Same driver-adapter shape uniqueConstraintName() documents for Prisma 7 +
// @prisma/adapter-pg.
function p2002(index: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { constraint: { index } } } },
  });
}

describe('InterviewSessionInfraRepository', () => {
  let prisma: jest.Mocked<
    Pick<InterviewSessionPrismaRepository, 'create' | 'update'>
  >;
  let events: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let repository: InterviewSessionInfraRepository;

  beforeEach(() => {
    prisma = { create: jest.fn(), update: jest.fn() };
    events = { emit: jest.fn() };
    repository = new InterviewSessionInfraRepository(
      prisma as unknown as InterviewSessionPrismaRepository,
      events as unknown as EventEmitter2,
    );
  });

  const session = () => new InterviewSession({ interviewId: 'interview-1' });

  describe('save', () => {
    it('maps a violation of the open-session index to InterviewSessionAlreadyOpenException', async () => {
      prisma.create.mockRejectedValue(p2002('interview_sessions_open_unique'));

      await expect(repository.save(session())).rejects.toThrow(
        InterviewSessionAlreadyOpenException,
      );
    });

    it('does not swallow any other unique violation', async () => {
      const other = p2002('interview_sessions_pkey');
      prisma.create.mockRejectedValue(other);

      await expect(repository.save(session())).rejects.toBe(other);
    });

    it('does not swallow non-Prisma errors', async () => {
      const boom = new Error('db down');
      prisma.create.mockRejectedValue(boom);

      await expect(repository.save(session())).rejects.toBe(boom);
    });
  });

  describe('update', () => {
    it('announces the room closing when a session is ended', async () => {
      const ended = session();
      ended.end();
      prisma.update.mockResolvedValue({
        id: ended.id,
        interviewId: 'interview-1',
        startedAt: ended.startedAt,
        endedAt: ended.endedAt,
        startedById: null,
        monitoringConsentAt: null,
        monitoringNoticeVersion: null,
        createdAt: ended.createdAt,
      });

      await repository.update(ended);

      expect(events.emit).toHaveBeenCalledWith(
        INTERVIEW_ROOM_CLOSED_EVENT,
        new InterviewRoomClosedEvent('interview-1'),
      );
    });

    it('stays silent while the session is still open', async () => {
      const open = session();
      prisma.update.mockResolvedValue({
        id: open.id,
        interviewId: 'interview-1',
        startedAt: open.startedAt,
        endedAt: null,
        startedById: null,
        monitoringConsentAt: null,
        monitoringNoticeVersion: null,
        createdAt: open.createdAt,
      });

      await repository.update(open);

      expect(events.emit).not.toHaveBeenCalled();
    });
  });
});
