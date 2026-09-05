import {
  ListApplicationsByJobHandler,
  ListApplicationsByJobQuery,
} from './list-applications-by-job.query';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { IApplicationUserLookupPort } from '@/modules/application/application/ports/user-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ReferencedJobNotFoundException } from '@/modules/application/domain/exceptions/application.exceptions';

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return new JobApplication({
    id: 'app-1',
    userId: 'candidate-1',
    jobId: 'job-1',
    cvId: 'cv-1',
    ...overrides,
  });
}

describe('ListApplicationsByJobHandler', () => {
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let jobLookupPort: jest.Mocked<IJobLookupPort>;
  let userLookupPort: jest.Mocked<IApplicationUserLookupPort>;
  let handler: ListApplicationsByJobHandler;

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
    jobLookupPort = {
      findById: jest.fn().mockResolvedValue({
        id: 'job-1',
        title: 'Backend Developer',
        postedById: 'recruiter-1',
        isOpen: true,
        isExpired: false,
        isDeleted: false,
        viewCount: 0,
      }),
    };
    userLookupPort = {
      findById: jest.fn(),
      findManyByIds: jest.fn().mockResolvedValue(new Map()),
    };
    handler = new ListApplicationsByJobHandler(
      applicationRepository,
      jobLookupPort,
      userLookupPort,
    );
  });

  it('throws ReferencedJobNotFoundException when the job does not exist', async () => {
    jobLookupPort.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ListApplicationsByJobQuery('recruiter-1', 'job-1')),
    ).rejects.toThrow(ReferencedJobNotFoundException);
  });

  it('throws UnauthorizedDomainException for a recruiter who does not own the job', async () => {
    await expect(
      handler.execute(new ListApplicationsByJobQuery('someone-else', 'job-1')),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(applicationRepository.findAllByJobId).not.toHaveBeenCalled();
  });

  it('passes normalized page/limit through to the repository', async () => {
    applicationRepository.findAllByJobId.mockResolvedValue({
      applications: [],
      total: 0,
    });

    const result = await handler.execute(
      new ListApplicationsByJobQuery('recruiter-1', 'job-1', 2, 10),
    );

    expect(applicationRepository.findAllByJobId).toHaveBeenCalledWith('job-1', {
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      applications: [],
      total: 0,
      page: 2,
      limit: 10,
    });
  });

  it('batches candidate lookups in a single call and attaches them by userId', async () => {
    applicationRepository.findAllByJobId.mockResolvedValue({
      applications: [
        makeApplication({ id: 'app-1', userId: 'candidate-1' }),
        makeApplication({ id: 'app-2', userId: 'candidate-2' }),
      ],
      total: 2,
    });
    userLookupPort.findManyByIds.mockResolvedValue(
      new Map([
        ['candidate-1', { id: 'candidate-1', fullName: 'Alice', avatarUrl: null }],
        ['candidate-2', { id: 'candidate-2', fullName: 'Bob', avatarUrl: null }],
      ]),
    );

    const result = await handler.execute(
      new ListApplicationsByJobQuery('recruiter-1', 'job-1'),
    );

    expect(userLookupPort.findManyByIds).toHaveBeenCalledTimes(1);
    expect(userLookupPort.findManyByIds).toHaveBeenCalledWith([
      'candidate-1',
      'candidate-2',
    ]);
    expect(userLookupPort.findById).not.toHaveBeenCalled();
    expect(result.applications[0].candidate).toEqual({
      id: 'candidate-1',
      fullName: 'Alice',
      avatarUrl: null,
    });
    expect(result.applications[1].candidate).toEqual({
      id: 'candidate-2',
      fullName: 'Bob',
      avatarUrl: null,
    });
  });
});
