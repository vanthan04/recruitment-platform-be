import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import { CreateNotificationCommand } from '@/modules/notification/application/commands/create-notification.command';
import { NotificationType } from '@/modules/notification/domain/value-objects/notification-type.vo';

/**
 * Mirrors `ApplicationEventsListener` (notification module): reacts to a
 * domain event by dispatching `CreateNotificationCommand` — but only when
 * the recipient has no live socket, matching "online -> realtime only,
 * offline -> notification".
 */
@Injectable()
export class ChatEventsListener {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly presenceService: ChatPresenceService,
  ) {}

  @OnEvent(MESSAGE_SENT_EVENT)
  async handleMessageSent(event: MessageSentEvent): Promise<void> {
    if (this.presenceService.isOnline(event.recipientId)) return;

    await this.commandBus.execute(
      new CreateNotificationCommand(
        event.recipientId,
        NotificationType.NEW_MESSAGE,
        'New message',
        `New message about "${event.jobTitle}": ${event.preview}`,
        { conversationId: event.conversationId, messageId: event.messageId },
      ),
    );
  }
}
