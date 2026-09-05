import {
  GetApplicationStatusHistoryHandler,
  GetApplicationStatusHistoryQuery,
} from './get-application-status-history.query';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationStatusHistoryRepository } from '@/modules/application/domain/repositories/application-status-history.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import {
  JobApplicationNotFoundException,
  ApplicationHistoryViewNotAllowedException,
} from '@/modules/application/domain/exceptions/application.exceptions';

function makeApplication(
  overrides: Partial<JobApplication> = {},
): JobApplication {
  return new JobApplication({
    id: 'app-1',
    userId: 'candidate-1',
    jobId: 'job-1',
    cvId: 'cv-1',
    ...overrides,
  });
}

describe('GetApplicationStatusHistoryHandler', () => {
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let historyRepository: jest.Mocked<IApplicationStatusHistoryRepository>;
  let jobLookupPort: jest.Mocked<IJobLookupPort>;
  let handler: GetApplicationStatusHistoryHandler;

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
    historyRepository = {
      create: jest.fn(),
      findByApplicationId: jest.fn(),
    };
    jobLookupPort = { findById: jest.fn() };
    handler = new GetApplicationStatusHistoryHandler(
      applicationRepository,
      historyRepository,
      jobLookupPort,
    );
  });

  it('throws JobApplicationNotFoundException when the application does not exist', async () => {
    applicationRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute(
        new GetApplicationStatusHistoryQuery('candidate-1', 'missing-app'),
      ),
    ).rejects.toThrow(JobApplicationNotFoundException);
  });

  it('denies a user who is neither the candidate nor the recruiter owner', async () => {
    applicationRepository.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue({
      id: 'job-1',
      title: 'Backend Developer',
      postedById: 'recruiter-1',
      isOpen: true,
      isExpired: false,
      isDeleted: false,
      viewCount: 0,
    });

    await expect(
      handler.execute(
        new GetApplicationStatusHistoryQuery('someone-else', 'app-1'),
      ),
    ).rejects.toThrow(ApplicationHistoryViewNotAllowedException);
  });

  it('allows the owning candidate to view the history', async () => {
    applicationRepository.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue({
      id: 'job-1',
      title: 'Backend Developer',
      postedById: 'recruiter-1',
      isOpen: true,
      isExpired: false,
      isDeleted: false,
      viewCount: 0,
    });
    historyRepository.findByApplicationId.mockResolvedValue([
      {
        id: 'hist-1',
        fromStatus: null,
        toStatus: ApplicationStatus.APPLIED,
        note: null,
        changedById: 'candidate-1',
        createdAt: new Date(),
      },
    ]);

    const result = await handler.execute(
      new GetApplicationStatusHistoryQuery('candidate-1', 'app-1'),
    );

    expect(result).toHaveLength(1);
    expect(result[0].toStatus).toBe(ApplicationStatus.APPLIED);
  });

  it('allows the recruiter who owns the job to view the history', async () => {
    applicationRepository.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue({
      id: 'job-1',
      title: 'Backend Developer',
      postedById: 'recruiter-1',
      isOpen: true,
      isExpired: false,
      isDeleted: false,
      viewCount: 0,
    });
    historyRepository.findByApplicationId.mockResolvedValue([]);

    const result = await handler.execute(
      new GetApplicationStatusHistoryQuery('recruiter-1', 'app-1'),
    );

    expect(result).toEqual([]);
  });
});
