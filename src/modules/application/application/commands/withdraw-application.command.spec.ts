import {
  WithdrawApplicationCommand,
  WithdrawApplicationHandler,
} from '@/modules/application/application/commands/withdraw-application.command';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import {
  JobApplicationNotFoundException,
  ApplicationOwnershipException,
} from '@/modules/application/domain/exceptions/application.exceptions';

describe('WithdrawApplicationHandler', () => {
  let handler: WithdrawApplicationHandler;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;

  function makeApplication(overrides: Partial<JobApplication> = {}) {
    return new JobApplication({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      cvId: 'cv-1',
      coverLetter: null,
      status: ApplicationStatus.APPLIED,
      ...overrides,
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

    handler = new WithdrawApplicationHandler(applicationRepository);
  });

  it('throws JobApplicationNotFoundException when the application does not exist', async () => {
    applicationRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new WithdrawApplicationCommand('candidate-1', 'app-1')),
    ).rejects.toThrow(JobApplicationNotFoundException);
  });

  it('rejects a candidate withdrawing an application that is not their own', async () => {
    applicationRepository.findById.mockResolvedValue(
      makeApplication({ userId: 'candidate-1' }),
    );

    await expect(
      handler.execute(
        new WithdrawApplicationCommand('a-different-candidate', 'app-1'),
      ),
    ).rejects.toThrow(ApplicationOwnershipException);

    expect(
      applicationRepository.updateWithStatusHistory,
    ).not.toHaveBeenCalled();
  });

  it('withdraws the application and its audit-history entry atomically', async () => {
    const application = makeApplication();
    applicationRepository.findById.mockResolvedValue(application);
    applicationRepository.updateWithStatusHistory.mockResolvedValue(
      makeApplication({ status: ApplicationStatus.WITHDRAWN }),
    );

    const result = await handler.execute(
      new WithdrawApplicationCommand('candidate-1', 'app-1'),
    );

    // Must go through the single atomic repository method, never a
    // separate update() + history create() pair.
    expect(applicationRepository.update).not.toHaveBeenCalled();
    expect(applicationRepository.updateWithStatusHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'app-1',
        status: ApplicationStatus.WITHDRAWN,
      }),
      {
        applicationId: 'app-1',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.WITHDRAWN,
        changedById: 'candidate-1',
        note: null,
      },
    );
    expect(result.status).toBe(ApplicationStatus.WITHDRAWN);
  });
});
