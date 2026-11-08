import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { IChatNotificationPort } from '@/modules/chat/application/ports/chat-notification.port';

/**
 * Reacts to a domain event by notifying the recipient via
 * IChatNotificationPort — but only when they have no live socket, matching
 * "online -> realtime only, offline -> notification".
 */
@Injectable()
export class ChatEventsListener {
  private readonly logger = new Logger(ChatEventsListener.name);

  constructor(
    private readonly presenceService: ChatPresenceService,
    private readonly notificationPort: IChatNotificationPort,
  ) {}

  @OnEvent(MESSAGE_SENT_EVENT)
  async handleMessageSent(event: MessageSentEvent): Promise<void> {
    // A system line (e.g. the application changed status) already has its own
    // notification from the application module — a second "new message"
    // notification for the same thing would just be a duplicate.
    if (event.message.messageType === MessageType.SYSTEM) return;
    if (this.presenceService.isOnline(event.recipientId)) return;

    // Best-effort notification for an offline recipient — the message
    // itself is already persisted and broadcast by the time this runs.
    // `emit()` doesn't await listeners, so letting this reject would become
    // an unhandled promise rejection and crash the whole process.
    try {
      await this.notificationPort.notifyNewMessage(
        event.recipientId,
        'Tin nhắn mới',
        `Tin nhắn mới về "${event.jobTitle}": ${event.preview}`,
        { conversationId: event.conversationId, messageId: event.messageId },
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify ${event.recipientId} of new message ${event.messageId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
