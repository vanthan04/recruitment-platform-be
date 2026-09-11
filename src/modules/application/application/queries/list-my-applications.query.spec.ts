import {
  ListMyApplicationsQuery,
  ListMyApplicationsHandler,
} from '@/modules/application/application/queries/list-my-applications.query';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

describe('ListMyApplicationsHandler', () => {
  let handler: ListMyApplicationsHandler;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;

  function makeApplication(id: string) {
    return new JobApplication({
      id,
      userId: 'candidate-1',
      jobId: 'job-1',
      cvId: 'cv-1',
      coverLetter: null,
      status: ApplicationStatus.APPLIED,
    });
  }

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

    handler = new ListMyApplicationsHandler(applicationRepository);
  });

  it('requests the correct skip/take from a page/limit pair and returns pagination metadata', async () => {
    applicationRepository.findAllByUserId.mockResolvedValue({
      applications: [makeApplication('app-21')],
      total: 45,
    });

    const result = await handler.execute(
      new ListMyApplicationsQuery('candidate-1', 3, 20),
    );

    expect(applicationRepository.findAllByUserId).toHaveBeenCalledWith(
      'candidate-1',
      {
        skip: 40,
        take: 20,
      },
    );
    expect(result).toEqual({
      applications: [expect.objectContaining({ id: 'app-21' })],
      total: 45,
      page: 3,
      limit: 20,
    });
  });

  it('falls back to page 1 for an invalid page number instead of an empty/negative skip', async () => {
    applicationRepository.findAllByUserId.mockResolvedValue({
      applications: [],
      total: 0,
    });

    const result = await handler.execute(
      new ListMyApplicationsQuery('candidate-1', -1, 20),
    );

    expect(applicationRepository.findAllByUserId).toHaveBeenCalledWith(
      'candidate-1',
      {
        skip: 0,
        take: 20,
      },
    );
    expect(result.page).toBe(1);
  });
});
