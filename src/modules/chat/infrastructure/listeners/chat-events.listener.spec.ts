import { ChatEventsListener } from './chat-events.listener';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import { IChatNotificationPort } from '@/modules/chat/application/ports/chat-notification.port';
import { MessageSentEvent } from '@/modules/chat/infrastructure/events/message-sent.event';

describe('ChatEventsListener', () => {
  let presenceService: jest.Mocked<ChatPresenceService>;
  let notificationPort: jest.Mocked<IChatNotificationPort>;
  let listener: ChatEventsListener;

  const event = new MessageSentEvent(
    { id: 'msg-1' } as any,
    'conversation-1',
    'sender-1',
    'recipient-1',
    'Senior Backend Engineer',
    'Hey, are you available for a call?',
  );

  beforeEach(() => {
    presenceService = { isOnline: jest.fn() } as any;
    notificationPort = { notifyNewMessage: jest.fn() };
    listener = new ChatEventsListener(presenceService, notificationPort);
  });

  it('skips notifying a recipient who is currently online', async () => {
    presenceService.isOnline.mockReturnValue(true);

    await listener.handleMessageSent(event);

    expect(notificationPort.notifyNewMessage).not.toHaveBeenCalled();
  });

  it('notifies an offline recipient', async () => {
    presenceService.isOnline.mockReturnValue(false);
    notificationPort.notifyNewMessage.mockResolvedValue(undefined);

    await listener.handleMessageSent(event);

    expect(notificationPort.notifyNewMessage).toHaveBeenCalledWith(
      'recipient-1',
      'New message',
      expect.stringContaining('Senior Backend Engineer'),
      { conversationId: 'conversation-1', messageId: 'msg-1' },
    );
  });

  it('does not throw (and does not crash the process) when the notification fails', async () => {
    presenceService.isOnline.mockReturnValue(false);
    notificationPort.notifyNewMessage.mockRejectedValue(
      new Error('mail provider down'),
    );

    await expect(listener.handleMessageSent(event)).resolves.toBeUndefined();
  });
});
