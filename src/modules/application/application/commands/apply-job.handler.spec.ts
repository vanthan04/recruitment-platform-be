import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplyJobHandler } from '@/modules/application/application/commands/apply-job.command';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import {
  IJobLookupPort,
  JobLookupResult,
} from '@/modules/application/application/ports/job-lookup.port';
import {
  ICvLookupPort,
  CvLookupResult,
} from '@/modules/application/application/ports/cv-lookup.port';
import { JOB_APPLIED_EVENT } from '@/modules/application/infrastructure/events/job-applied.event';
import {
  EntityNotFoundException,
  DuplicateEntityException,
} from '@/common/exceptions/domain.exception';

function makeOpenJob(
  overrides: Partial<JobLookupResult> = {},
): JobLookupResult {
  return {
    id: 'job-1',
    title: 'Backend Developer',
    postedById: 'recruiter-1',
    isOpen: true,
    isExpired: false,
    isDeleted: false,
    viewCount: 0,
    ...overrides,
  };
}

function makePublishedCv(
  overrides: Partial<CvLookupResult> = {},
): CvLookupResult {
  return {
    id: 'cv-1',
    userId: 'candidate-1',
    isPublished: true,
    isDeleted: false,
    ...overrides,
  };
}

describe('ApplyJobHandler', () => {
  let handler: ApplyJobHandler;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let jobLookupPort: jest.Mocked<IJobLookupPort>;
  let cvLookupPort: jest.Mocked<ICvLookupPort>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    applicationRepository = {
      findById: jest.fn(),
      findByUserIdAndJobId: jest.fn(),
      findAllByJobId: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      countByJobIdGroupedByStatus: jest.fn(),
    };
    jobLookupPort = { findById: jest.fn() };
    cvLookupPort = { findById: jest.fn() };
    eventEmitter = { emit: jest.fn() } as any;

    handler = new ApplyJobHandler(
      applicationRepository,
      jobLookupPort,
      cvLookupPort,
      eventEmitter,
    );
  });

  it('throws EntityNotFoundException when the job does not exist', async () => {
    jobLookupPort.findById.mockResolvedValue(null);
    cvLookupPort.findById.mockResolvedValue(makePublishedCv());

    await expect(
      handler.execute({
        userId: 'candidate-1',
        input: { jobId: 'job-1', cvId: 'cv-1' },
      } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException when the CV does not exist', async () => {
    jobLookupPort.findById.mockResolvedValue(makeOpenJob());
    cvLookupPort.findById.mockResolvedValue(null);

    await expect(
      handler.execute({
        userId: 'candidate-1',
        input: { jobId: 'job-1', cvId: 'cv-1' },
      } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws when the CV is not published', async () => {
    jobLookupPort.findById.mockResolvedValue(makeOpenJob());
    cvLookupPort.findById.mockResolvedValue(
      makePublishedCv({ isPublished: false }),
    );

    await expect(
      handler.execute({
        userId: 'candidate-1',
        input: { jobId: 'job-1', cvId: 'cv-1' },
      } as any),
    ).rejects.toThrow();
  });

  it('throws when a different candidate owns the CV', async () => {
    jobLookupPort.findById.mockResolvedValue(makeOpenJob());
    cvLookupPort.findById.mockResolvedValue(
      makePublishedCv({ userId: 'someone-else' }),
    );

    await expect(
      handler.execute({
        userId: 'candidate-1',
        input: { jobId: 'job-1', cvId: 'cv-1' },
      } as any),
    ).rejects.toThrow();
  });

  it('throws DuplicateEntityException when already applied to the job', async () => {
    jobLookupPort.findById.mockResolvedValue(makeOpenJob());
    cvLookupPort.findById.mockResolvedValue(makePublishedCv());
    applicationRepository.findByUserIdAndJobId.mockResolvedValue({
      id: 'existing-app',
    } as any);

    await expect(
      handler.execute({
        userId: 'candidate-1',
        input: { jobId: 'job-1', cvId: 'cv-1' },
      } as any),
    ).rejects.toThrow(DuplicateEntityException);
  });

  it('saves the application and emits job.applied on success', async () => {
    jobLookupPort.findById.mockResolvedValue(makeOpenJob());
    cvLookupPort.findById.mockResolvedValue(makePublishedCv());
    applicationRepository.findByUserIdAndJobId.mockResolvedValue(null);
    applicationRepository.save.mockImplementation(
      async (app) => ({ ...app, id: 'app-1' }) as any,
    );

    const result = await handler.execute({
      userId: 'candidate-1',
      input: { jobId: 'job-1', cvId: 'cv-1', coverLetter: 'Hire me' },
    } as any);

    expect(result.id).toBe('app-1');
    expect(applicationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'candidate-1',
        jobId: 'job-1',
        cvId: 'cv-1',
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      JOB_APPLIED_EVENT,
      expect.objectContaining({
        applicationId: 'app-1',
        userId: 'candidate-1',
        recruiterId: 'recruiter-1',
      }),
    );
  });
});
