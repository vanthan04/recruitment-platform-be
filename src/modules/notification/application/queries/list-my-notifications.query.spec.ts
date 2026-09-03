import {
  ListMyNotificationsQuery,
  ListMyNotificationsHandler,
} from '@/modules/notification/application/queries/list-my-notifications.query';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';
import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

describe('ListMyNotificationsHandler', () => {
  let handler: ListMyNotificationsHandler;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepository = {
      findById: jest.fn(),
      findAllByUserPaginated: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    handler = new ListMyNotificationsHandler(notificationRepository);
  });

  it('paginates notifications for the given user and echoes page/limit', async () => {
    notificationRepository.findAllByUserPaginated.mockResolvedValue({
      notifications: [
        new Notification({
          id: 'notif-1',
          userId: 'user-1',
          type: NotificationType.NEW_MESSAGE,
          title: 'New message',
          message: 'Hi',
        }),
      ],
      total: 1,
    });

    const result = await handler.execute(
      new ListMyNotificationsQuery('user-1', 2, 10),
    );

    expect(notificationRepository.findAllByUserPaginated).toHaveBeenCalledWith(
      'user-1',
      2,
      10,
    );
    expect(result).toEqual({
      notifications: [expect.objectContaining({ id: 'notif-1' })],
      total: 1,
      page: 2,
      limit: 10,
    });
  });
});
