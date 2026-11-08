import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { MessageAttachmentUrlResolver } from '@/modules/chat/application/services/message-attachment-url-resolver.service';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { ensureConversationOpen } from '@/modules/chat/application/utils/ensure-conversation-open.util';
import {
  MESSAGE_UPDATED_EVENT,
  MessageUpdatedEvent,
} from '@/modules/chat/infrastructure/events/message-updated.event';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

export class EditMessageCommand extends Command<MessageResponseDto> {
  constructor(
    public readonly userId: string,
    public readonly messageId: string,
    public readonly content: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(EditMessageCommand)
export class EditMessageHandler implements ICommandHandler<
  EditMessageCommand,
  MessageResponseDto
> {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationRepository: IConversationRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly attachmentUrlResolver: MessageAttachmentUrlResolver,
    private readonly applicationLookupPort: IChatApplicationLookupPort,
  ) {}

  async execute({
    userId,
    messageId,
    content,
  }: EditMessageCommand): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) throw new MessageNotFoundException(messageId);

    message.ensureSender(userId);

    const conversation = await this.conversationRepository.findById(
      message.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundException(message.conversationId);
    }
    // The sender check above already implies membership today, but the
    // recipient lookup below is only meaningful for a member — keep the
    // invariant explicit rather than relying on it implicitly.
    conversation.ensureMember(userId);
    // Editing rewrites what the other side already saw — as much a "new
    // message" as sending one. (Deleting is deliberately still allowed.)
    await ensureConversationOpen(
      this.applicationLookupPort,
      conversation.applicationId,
    );

    message.edit(content);

    const updated = await this.messageRepository.update(message);

    // A TEXT message can still carry attachments (see CreateMessageHandler),
    // whose stored `fileUrl` is a private key until resolved — never return
    // or broadcast the raw key.
    const dto = await this.attachmentUrlResolver.resolve(
      MessageResponseMapper.toDto(updated),
    );

    this.eventEmitter.emit(
      MESSAGE_UPDATED_EVENT,
      new MessageUpdatedEvent(
        dto,
        conversation.id,
        userId,
        conversation.otherParticipantId(userId),
      ),
    );

    return dto;
  }
}
