export interface ChatNotificationMetadata {
  conversationId: string;
  messageId: string;
}

/**
 * Narrow port for what `chat` needs from the `notification` module — just
 * "tell this user about a new message", not the full INotificationService
 * surface (mirrors how `auth` wraps `mail`'s IMailService in its own port).
 */
export abstract class IChatNotificationPort {
  abstract notifyNewMessage(
    recipientId: string,
    title: string,
    message: string,
    metadata: ChatNotificationMetadata,
  ): Promise<void>;
}
