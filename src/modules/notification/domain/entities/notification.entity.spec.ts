import { Notification } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';
import { NotificationAlreadyReadException } from '@/modules/notification/domain/exceptions/notification.exceptions';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return new Notification({
    userId: 'user-1',
    type: NotificationType.APPLICATION_STATUS_CHANGED,
    title: 'Application updated',
    message: 'Your application status changed',
    ...overrides,
  });
}

describe('Notification entity', () => {
  it('defaults readAt to null (unread) and metadata to null', () => {
    const notification = makeNotification();
    expect(notification.readAt).toBeNull();
    expect(notification.isRead).toBe(false);
    expect(notification.metadata).toBeNull();
  });

  it('marks an unread notification as read', () => {
    const notification = makeNotification();
    notification.markAsRead();
    expect(notification.readAt).toBeInstanceOf(Date);
    expect(notification.isRead).toBe(true);
  });

  it('throws NotificationAlreadyReadException when already read', () => {
    const notification = makeNotification({ readAt: new Date() });
    expect(() => notification.markAsRead()).toThrow(
      NotificationAlreadyReadException,
    );
  });
});
