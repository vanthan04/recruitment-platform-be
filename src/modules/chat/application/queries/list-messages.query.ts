import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { MessageResponseMapper } from '@/modules/chat/application/mappers/message-response.mapper';
import { MessagePageResponseDto } from '@/modules/chat/application/dto/message-response.dto';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class ListMessagesQuery {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
    public readonly cursor?: string,
    public readonly limit: number = 30,
  ) {}
}

@Injectable()
@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler implements IQueryHandler<
  ListMessagesQuery,
  MessagePageResponseDto
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute({
    userId,
    conversationId,
    cursor,
    limit,
  }: ListMessagesQuery): Promise<MessagePageResponseDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation)
      throw new EntityNotFoundException('Conversation', conversationId);
    conversation.ensureMember(userId);

    const { items, nextCursor } = await this.messageRepository.findPage(
      conversationId,
      cursor,
      limit,
    );

    const dto = new MessagePageResponseDto();
    dto.items = MessageResponseMapper.toDtoList(items);
    dto.nextCursor = nextCursor;
    return dto;
  }
}
