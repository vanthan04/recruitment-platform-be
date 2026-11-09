import { Prisma } from '@prisma/client';
import { InterviewSessionInfraRepository } from './interview-session.infra-repository';
import { InterviewSessionPrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-session-prisma.repository';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewSessionAlreadyOpenException } from '@/modules/interview/domain/exceptions/interview.exceptions';

// Same driver-adapter shape uniqueConstraintName() documents for Prisma 7 +
// @prisma/adapter-pg.
function p2002(index: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { constraint: { index } } } },
  });
}

describe('InterviewSessionInfraRepository.save', () => {
  let prisma: jest.Mocked<Pick<InterviewSessionPrismaRepository, 'create'>>;
  let repository: InterviewSessionInfraRepository;

  beforeEach(() => {
    prisma = { create: jest.fn() };
    repository = new InterviewSessionInfraRepository(
      prisma as unknown as InterviewSessionPrismaRepository,
    );
  });

  const session = () => new InterviewSession({ interviewId: 'interview-1' });

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
