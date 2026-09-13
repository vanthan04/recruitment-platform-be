import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageAttachment } from '@/modules/chat/domain/entities/message-attachment.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { MessageAttachmentUrlResolver } from '@/modules/chat/application/services/message-attachment-url-resolver.service';
import {
  UploadFolder,
  isPrivateUploadKey,
} from '@/modules/file-upload/domain/value-objects/upload-folder.vo';
import {
  MESSAGE_SENT_EVENT,
  MessageSentEvent,
} from '@/modules/chat/infrastructure/events/message-sent.event';
import {
  ConversationNotFoundException,
  SystemMessageNotAllowedException,
  TooManyAttachmentsException,
  EmptyMessageException,
  InvalidAttachmentUrlException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

export interface CreateMessageAttachmentInput {
  fileName: string;
  /** Storage key from POST /files/upload?folder=chat-attachments — never a URL. */
  fileKey: string;
  mimeType: string;
  fileSize: number;
}

const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export class CreateMessageCommand extends Command<MessageResponseDto> {
  constructor(
    public readonly senderId: string,
    public readonly conversationId: string,
    public readonly clientMessageId: string,
    public readonly content: string,
    public readonly messageType: MessageType = MessageType.TEXT,
    public readonly attachments: CreateMessageAttachmentInput[] = [],
  ) {
    super();
  }
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
    private readonly attachmentUrlResolver: MessageAttachmentUrlResolver,
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
    if (!conversation) throw new ConversationNotFoundException(conversationId);
    conversation.ensureMember(senderId);

    // Idempotency — a REST retry, a WS reconnect-resend, or a double-click all
    // collapse onto the same row via this lookup + the DB's unique constraint.
    const existing = await this.messageRepository.findByClientMessageId(
      conversationId,
      clientMessageId,
    );
    if (existing) {
      return this.attachmentUrlResolver.resolve(
        MessageResponseMapper.toDto(existing),
      );
    }

    if (messageType === MessageType.SYSTEM) {
      throw new SystemMessageNotAllowedException();
    }
    if (attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      throw new TooManyAttachmentsException(MAX_ATTACHMENTS_PER_MESSAGE);
    }
    if (!content.trim() && attachments.length === 0) {
      throw new EmptyMessageException();
    }
    // A client-supplied fileKey that doesn't match the exact shape our own
    // upload flow produces is a tracking-pixel/phishing vector dressed up as
    // an attachment (a legitimate-looking fileName/mimeType pointing at
    // whatever the forged key actually resolves to) — DTO-level validation
    // already checks this shape; re-checked here as the domain boundary.
    for (const attachment of attachments) {
      if (
        !isPrivateUploadKey(UploadFolder.CHAT_ATTACHMENTS, attachment.fileKey)
      ) {
        throw new InvalidAttachmentUrlException();
      }
    }

    const message = new Message({
      conversationId,
      senderId,
      content: content.trim(),
      messageType,
      clientMessageId,
      // The domain/persistence field is still named `fileUrl` (see
      // message-attachment.entity.ts) — it holds a private storage key until
      // MessageAttachmentUrlResolver turns it into a real URL at read time.
      attachments: attachments.map(
        (a) =>
          new MessageAttachment({
            fileName: a.fileName,
            fileUrl: a.fileKey,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
            messageId: '',
          }),
      ),
    });

    const saved =
      await this.messageRepository.createAndTouchConversation(message);

    const recipientId = conversation.otherParticipantId(senderId);
    const job = await this.jobLookupPort.findById(conversation.jobId);
    const dto = await this.attachmentUrlResolver.resolve(
      MessageResponseMapper.toDto(saved),
    );
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
