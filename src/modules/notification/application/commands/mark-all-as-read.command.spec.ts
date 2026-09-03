import {
  MarkAllAsReadCommand,
  MarkAllAsReadHandler,
} from '@/modules/notification/application/commands/mark-all-as-read.command';
import { INotificationRepository } from '@/modules/notification/domain/repositories/notification.repository';

describe('MarkAllAsReadHandler', () => {
  let handler: MarkAllAsReadHandler;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepository = {
      findById: jest.fn(),
      findAllByUserPaginated: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    handler = new MarkAllAsReadHandler(notificationRepository);
  });

  it('delegates to the repository for the given user', async () => {
    await handler.execute(new MarkAllAsReadCommand('user-1'));

    expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
