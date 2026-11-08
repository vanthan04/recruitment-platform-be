import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import { ConversationNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';

/**
 * Posts a system line (e.g. "the application moved to Interview") into a
 * conversation. Internal only — there is no REST/WS entry point, and
 * CreateMessageHandler still refuses SYSTEM from clients.
 *
 * `senderId` is the user the event is attributed to. It must be a member:
 * the line is stored as that user's message (the column is non-null), which
 * also means it counts as unread for the *other* participant only.
 */
export class CreateSystemMessageCommand extends Command<MessageResponseDto> {
  constructor(
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly content: string,
    /** Idempotency key — see applicationStatusSystemMessageKey. */
    public readonly clientMessageId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(CreateSystemMessageCommand)
export class CreateSystemMessageHandler implements ICommandHandler<
  CreateSystemMessageCommand,
  MessageResponseDto
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly jobLookupPort: IChatJobLookupPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    conversationId,
    senderId,
    content,
    clientMessageId,
  }: CreateSystemMessageCommand): Promise<MessageResponseDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new ConversationNotFoundException(conversationId);
    conversation.ensureMember(senderId);

    // Already posted (a redelivered event): return it, and don't broadcast again.
    const existing = await this.messageRepository.findByClientMessageId(
      conversationId,
      clientMessageId,
    );
    if (existing) return MessageResponseMapper.toDto(existing);

    // Deliberately no ensureConversationOpen: the line announcing REJECTED /
    // WITHDRAWN is exactly what a conversation that just became read-only
    // needs to show.
    const saved = await this.messageRepository.createAndTouchConversation(
      new Message({
        conversationId,
        senderId,
        content,
        messageType: MessageType.SYSTEM,
        clientMessageId,
      }),
    );

    const job = await this.jobLookupPort.findById(conversation.jobId);
    const dto = MessageResponseMapper.toDto(saved);
    this.eventEmitter.emit(
      MESSAGE_SENT_EVENT,
      new MessageSentEvent(
        dto,
        conversationId,
        senderId,
        conversation.otherParticipantId(senderId),
        job?.title ?? 'một vị trí',
        saved.displayContent().slice(0, 120),
      ),
    );
    return dto;
  }
}
