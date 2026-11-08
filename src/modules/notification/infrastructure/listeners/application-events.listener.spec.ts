import { CommandBus } from '@nestjs/cqrs';
import { ApplicationEventsListener } from './application-events.listener';
import { JobAppliedEvent } from '@/modules/application/infrastructure/events/job-applied.event';
import { ApplicationStatusChangedEvent } from '@/modules/application/infrastructure/events/application-status-changed.event';
import { CreateNotificationCommand } from '@/modules/notification/application/commands/create-notification.command';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
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
    // Addressed to the recruiter, in Vietnamese, naming the job.
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      userId: 'recruiter-1',
      type: NotificationType.NEW_APPLICATION,
      title: 'Có đơn ứng tuyển mới',
      message: 'Bạn có đơn ứng tuyển mới cho vị trí "Senior Backend Engineer"',
      metadata: { applicationId: 'app-1', jobId: 'job-1' },
    });
  });

  it('tells the candidate about a status change in Vietnamese, with the label rather than the raw status', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await listener.handleApplicationStatusChanged(
      new ApplicationStatusChangedEvent(
        'app-1',
        'candidate-1',
        'job-1',
        'Senior Backend Engineer',
        ApplicationStatus.HIRED,
      ),
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock
      .calls[0][0] as CreateNotificationCommand;
    expect(command).toMatchObject({
      userId: 'candidate-1',
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      title: 'Đơn ứng tuyển được cập nhật',
      message:
        'Đơn ứng tuyển của bạn cho vị trí "Senior Backend Engineer" đã chuyển sang trạng thái "Đã tuyển"',
      metadata: { applicationId: 'app-1', jobId: 'job-1', status: 'HIRED' },
    });
    // The status code stays in metadata (clients rely on it) but never leaks into the text.
    expect(command.message).not.toContain('HIRED');
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
