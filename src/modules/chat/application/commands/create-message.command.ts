import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageAttachment } from '@/modules/chat/domain/entities/message-attachment.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import {
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

export interface CreateMessageAttachmentInput {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export class CreateMessageCommand {
  constructor(
    public readonly senderId: string,
    public readonly conversationId: string,
    public readonly clientMessageId: string,
    public readonly content: string,
    public readonly messageType: MessageType = MessageType.TEXT,
    public readonly attachments: CreateMessageAttachmentInput[] = [],
  ) {}
}

@Injectable()
@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<
  CreateMessageCommand,
  MessageResponseDto
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly jobLookupPort: IChatJobLookupPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CreateMessageCommand): Promise<MessageResponseDto> {
    const {
      senderId,
      conversationId,
      clientMessageId,
      content,
      messageType,
      attachments,
    } = command;

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation)
      throw new EntityNotFoundException('Conversation', conversationId);
    conversation.ensureMember(senderId);

    // Idempotency — a REST retry, a WS reconnect-resend, or a double-click all
    // collapse onto the same row via this lookup + the DB's unique constraint.
    const existing = await this.messageRepository.findByClientMessageId(
      conversationId,
      clientMessageId,
    );
    if (existing) {
      return MessageResponseMapper.toDto(existing);
    }

    if (messageType === MessageType.SYSTEM) {
      throw new BusinessRuleViolationException(
        'System messages cannot be sent by a user',
      );
    }
    if (attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      throw new BusinessRuleViolationException(
        `A message can have at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments`,
      );
    }
    if (!content.trim() && attachments.length === 0) {
      throw new BusinessRuleViolationException(
        'Message must have content or at least one attachment',
      );
    }

    const message = new Message({
      conversationId,
      senderId,
      content: content.trim(),
      messageType,
      clientMessageId,
      attachments: attachments.map(
        (a) => new MessageAttachment({ ...a, messageId: '' }),
      ),
    });

    const saved = await this.messageRepository.create(message);
    await this.conversationRepository.touchLastMessageAt(
      conversationId,
      saved.createdAt,
    );

    const recipientId = conversation.otherParticipantId(senderId);
    const job = await this.jobLookupPort.findById(conversation.jobId);
    const dto = MessageResponseMapper.toDto(saved);
    this.eventEmitter.emit(
      MESSAGE_SENT_EVENT,
      new MessageSentEvent(
        dto,
        conversationId,
        senderId,
        recipientId,
        job?.title ?? 'a job',
        saved.displayContent().slice(0, 120),
      ),
    );

    return dto;
  }
}
