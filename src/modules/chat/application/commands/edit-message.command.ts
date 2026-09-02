import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { MessageNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';

export class EditMessageCommand {
  constructor(
    public readonly userId: string,
    public readonly messageId: string,
    public readonly content: string,
  ) {}
}

@Injectable()
@CommandHandler(EditMessageCommand)
export class EditMessageHandler implements ICommandHandler<
  EditMessageCommand,
  MessageResponseDto
> {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute({
    userId,
    messageId,
    content,
  }: EditMessageCommand): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) throw new MessageNotFoundException(messageId);

    message.ensureSender(userId);
    message.edit(content);

    const updated = await this.messageRepository.update(message);
    return MessageResponseMapper.toDto(updated);
  }
}
