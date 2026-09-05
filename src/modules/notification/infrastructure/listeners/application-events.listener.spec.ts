import { CommandBus } from '@nestjs/cqrs';
import { ApplicationEventsListener } from './application-events.listener';
import { JobAppliedEvent } from '@/modules/application/infrastructure/events/job-applied.event';
import { ApplicationStatusChangedEvent } from '@/modules/application/infrastructure/events/application-status-changed.event';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

describe('ApplicationEventsListener', () => {
  let commandBus: jest.Mocked<CommandBus>;
  let listener: ApplicationEventsListener;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as any;
    listener = new ApplicationEventsListener(commandBus);
  });

  it('creates a notification when a job is applied to', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await listener.handleJobApplied(
      new JobAppliedEvent(
        'app-1',
        'candidate-1',
        'job-1',
        'cv-1',
        'recruiter-1',
        'Senior Backend Engineer',
      ),
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('does not throw (and does not crash the process) when notification creation fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('DB connection lost'));

    await expect(
      listener.handleJobApplied(
        new JobAppliedEvent(
          'app-1',
          'candidate-1',
          'job-1',
          'cv-1',
          'recruiter-1',
          'Senior Backend Engineer',
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it('does not throw when the status-changed notification fails either', async () => {
    commandBus.execute.mockRejectedValue(new Error('DB connection lost'));

    await expect(
      listener.handleApplicationStatusChanged(
        new ApplicationStatusChangedEvent(
          'app-1',
          'candidate-1',
          'job-1',
          'Senior Backend Engineer',
          ApplicationStatus.SHORTLISTED,
        ),
      ),
    ).resolves.toBeUndefined();
  });
});
