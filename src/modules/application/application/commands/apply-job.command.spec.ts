import { Prisma } from '@prisma/client';
import {
  ApplyJobCommand,
  ApplyJobHandler,
} from '@/modules/application/application/commands/apply-job.command';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ICvLookupPort } from '@/modules/application/application/ports/cv-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { AlreadyAppliedException } from '@/modules/application/domain/exceptions/application.exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ApplyJobHandler', () => {
  let handler: ApplyJobHandler;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let jobLookupPort: jest.Mocked<IJobLookupPort>;
  let cvLookupPort: jest.Mocked<ICvLookupPort>;
  let eventEmitter: { emit: jest.Mock };

  const openJob = {
    id: 'job-1',
    title: 'Backend Developer',
    postedById: 'recruiter-1',
    isOpen: true,
    isExpired: false,
    isDeleted: false,
    viewCount: 0,
  };
  const publishedCv = {
    id: 'cv-1',
    userId: 'user-1',
    isPublished: true,
    isDeleted: false,
  };

  beforeEach(() => {
    applicationRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByUserIdAndJobId: jest.fn(),
      findAllByJobId: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateWithStatusHistory: jest.fn(),
      countByJobIdGroupedByStatus: jest.fn(),
    };
    jobLookupPort = { findById: jest.fn() };
    cvLookupPort = { findById: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    handler = new ApplyJobHandler(
      applicationRepository,
      jobLookupPort,
      cvLookupPort,
      eventEmitter as unknown as EventEmitter2,
    );

    jobLookupPort.findById.mockResolvedValue(openJob);
    cvLookupPort.findById.mockResolvedValue(publishedCv);
    applicationRepository.findByUserIdAndJobId.mockResolvedValue(null);
  });

  it('saves the application and emits JOB_APPLIED_EVENT on success', async () => {
    applicationRepository.save.mockImplementation(
      async (a) => new JobApplication({ ...a, id: 'app-1' }),
    );

    await handler.execute(
      new ApplyJobCommand('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
    );

    expect(applicationRepository.save).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('throws AlreadyAppliedException when an existing application is found first', async () => {
    applicationRepository.findByUserIdAndJobId.mockResolvedValue(
      new JobApplication({
        id: 'app-1',
        userId: 'user-1',
        jobId: 'job-1',
        cvId: 'cv-1',
      }),
    );

    await expect(
      handler.execute(
        new ApplyJobCommand('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
      ),
    ).rejects.toThrow(AlreadyAppliedException);
    expect(applicationRepository.save).not.toHaveBeenCalled();
  });

  it('translates a P2002 race (two concurrent applies past the existence check) into AlreadyAppliedException', async () => {
    applicationRepository.save.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['userId', 'jobId'] },
      }),
    );

    await expect(
      handler.execute(
        new ApplyJobCommand('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
      ),
    ).rejects.toThrow(AlreadyAppliedException);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rethrows a non-P2002 error from save untouched', async () => {
    applicationRepository.save.mockRejectedValue(new Error('DB is down'));

    await expect(
      handler.execute(
        new ApplyJobCommand('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
      ),
    ).rejects.toThrow('DB is down');
  });
});
