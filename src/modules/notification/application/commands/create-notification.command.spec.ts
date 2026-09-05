import {
  CreateNotificationCommand,
  CreateNotificationHandler,
} from '@/modules/notification/application/commands/create-notification.command';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

describe('CreateNotificationHandler', () => {
  let handler: CreateNotificationHandler;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepository = {
      findById: jest.fn(),
      findAllByUserPaginated: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    handler = new CreateNotificationHandler(notificationRepository);
  });

  it('creates and saves an unread notification for the target user', async () => {
    notificationRepository.save.mockImplementation(async (n) => n);

    await handler.execute(
      new CreateNotificationCommand(
        'user-1',
        NotificationType.NEW_APPLICATION,
        'New application',
        'You received a new application',
        { jobId: 'job-1' },
      ),
    );

    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: NotificationType.NEW_APPLICATION,
        title: 'New application',
        message: 'You received a new application',
        metadata: { jobId: 'job-1' },
        readAt: null,
      }),
    );
  });

  it('defaults metadata to null when not provided', async () => {
    notificationRepository.save.mockImplementation(async (n) => n);

    await handler.execute(
      new CreateNotificationCommand(
        'user-1',
        NotificationType.NEW_MESSAGE,
        'New message',
        'You have a new message',
      ),
    );

    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: null }),
    );
  });
});
