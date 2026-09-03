import {
  MarkAsReadCommand,
  MarkAsReadHandler,
} from '@/modules/notification/application/commands/mark-as-read.command';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { NotificationNotFoundException } from '@/modules/notification/domain/exceptions/notification.exceptions';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return new Notification({
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.NEW_MESSAGE,
    title: 'New message',
    message: 'You have a new message',
    ...overrides,
  });
}

describe('MarkAsReadHandler', () => {
  let handler: MarkAsReadHandler;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepository = {
      findById: jest.fn(),
      findAllByUserPaginated: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    handler = new MarkAsReadHandler(notificationRepository);
  });

  it('throws NotificationNotFoundException when the notification does not exist', async () => {
    notificationRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new MarkAsReadCommand('user-1', 'notif-1')),
    ).rejects.toThrow(NotificationNotFoundException);
  });

  it('throws NotificationNotFoundException when it belongs to another user (no leak)', async () => {
    notificationRepository.findById.mockResolvedValue(
      makeNotification({ userId: 'someone-else' }),
    );

    await expect(
      handler.execute(new MarkAsReadCommand('user-1', 'notif-1')),
    ).rejects.toThrow(NotificationNotFoundException);
    expect(notificationRepository.update).not.toHaveBeenCalled();
  });

  it('marks the notification read and persists it', async () => {
    notificationRepository.findById.mockResolvedValue(makeNotification());
    notificationRepository.update.mockImplementation(async (n) => n);

    const result = await handler.execute(
      new MarkAsReadCommand('user-1', 'notif-1'),
    );

    expect(result.isRead).toBe(true);
    expect(notificationRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ isRead: true }),
    );
  });
});
