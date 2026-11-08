import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import {
  MESSAGE_DELETED_EVENT,
  MessageDeletedEvent,
} from '@/modules/chat/infrastructure/events/message-deleted.event';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

export class DeleteMessageCommand extends Command<MessageResponseDto> {
  constructor(
    public readonly userId: string,
    public readonly messageId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler implements ICommandHandler<
  DeleteMessageCommand,
  MessageResponseDto
> {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationRepository: IConversationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    userId,
    messageId,
  }: DeleteMessageCommand): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) throw new MessageNotFoundException(messageId);

    message.ensureSender(userId);

    const conversation = await this.conversationRepository.findById(
      message.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundException(message.conversationId);
    }
    conversation.ensureMember(userId);

    message.softDelete();

    const updated = await this.messageRepository.update(message);
    // A deleted message's DTO has no attachments (see MessageResponseMapper),
    // so there is nothing for the URL resolver to sign here.
    const dto = MessageResponseMapper.toDto(updated);

    this.eventEmitter.emit(
      MESSAGE_DELETED_EVENT,
      new MessageDeletedEvent(
        dto,
        conversation.id,
        userId,
        conversation.otherParticipantId(userId),
      ),
    );

    return dto;
  }
}
