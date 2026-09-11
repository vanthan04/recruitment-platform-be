import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UpdateApplicationStatusCommand,
  UpdateApplicationStatusHandler,
} from '@/modules/application/application/commands/update-application-status.command';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { JobApplicationNotFoundException } from '@/modules/application/domain/exceptions/application.exceptions';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { APPLICATION_STATUS_CHANGED_EVENT } from '@/modules/application/infrastructure/events/application-status-changed.event';

describe('UpdateApplicationStatusHandler', () => {
  let handler: UpdateApplicationStatusHandler;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let jobLookupPort: jest.Mocked<IJobLookupPort>;
  let eventEmitter: { emit: jest.Mock };

  const job = {
    id: 'job-1',
    title: 'Backend Developer',
    postedById: 'recruiter-1',
    isOpen: true,
    isExpired: false,
    isDeleted: false,
    viewCount: 0,
  };

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
    jobLookupPort = { findById: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    handler = new UpdateApplicationStatusHandler(
      applicationRepository,
      jobLookupPort,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('throws JobApplicationNotFoundException when the application does not exist', async () => {
    applicationRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateApplicationStatusCommand(
          'recruiter-1',
          'app-1',
          ApplicationStatus.SCREENING,
        ),
      ),
    ).rejects.toThrow(JobApplicationNotFoundException);
  });

  it('rejects a recruiter who did not post the job the application belongs to', async () => {
    applicationRepository.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue(job);

    await expect(
      handler.execute(
        new UpdateApplicationStatusCommand(
          'some-other-recruiter',
          'app-1',
          ApplicationStatus.SCREENING,
        ),
      ),
    ).rejects.toThrow(UnauthorizedDomainException);

    expect(
      applicationRepository.updateWithStatusHistory,
    ).not.toHaveBeenCalled();
  });

  it('persists the new status and its audit-history entry atomically, and emits the status-changed event', async () => {
    const application = makeApplication();
    applicationRepository.findById.mockResolvedValue(application);
    jobLookupPort.findById.mockResolvedValue(job);
    applicationRepository.updateWithStatusHistory.mockResolvedValue(
      makeApplication({ status: ApplicationStatus.SCREENING }),
    );

    const result = await handler.execute(
      new UpdateApplicationStatusCommand(
        'recruiter-1',
        'app-1',
        ApplicationStatus.SCREENING,
        'Looks promising',
      ),
    );

    // The status update and its history row must go through the single
    // atomic repository method — never a separate update() + history
    // create(), which is exactly what let the two fall out of sync.
    expect(applicationRepository.update).not.toHaveBeenCalled();
    expect(applicationRepository.updateWithStatusHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'app-1',
        status: ApplicationStatus.SCREENING,
      }),
      {
        applicationId: 'app-1',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.SCREENING,
        changedById: 'recruiter-1',
        note: 'Looks promising',
      },
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      APPLICATION_STATUS_CHANGED_EVENT,
      expect.objectContaining({
        applicationId: 'app-1',
        status: ApplicationStatus.SCREENING,
      }),
    );
    expect(result.status).toBe(ApplicationStatus.SCREENING);
  });
});
