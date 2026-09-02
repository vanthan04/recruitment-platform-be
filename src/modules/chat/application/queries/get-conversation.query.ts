import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { IChatUserLookupPort } from '@/modules/chat/application/ports/user-lookup.port';
import { ConversationResponseMapper } from '@/modules/chat/application/mappers/conversation-response.mapper';
import { ConversationResponseDto } from '@/modules/chat/application/dto/conversation-response.dto';
import { ConversationNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';

export class GetConversationQuery {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetConversationQuery)
export class GetConversationHandler implements IQueryHandler<
  GetConversationQuery,
  ConversationResponseDto
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly jobLookupPort: IChatJobLookupPort,
    private readonly applicationLookupPort: IChatApplicationLookupPort,
    private readonly userLookupPort: IChatUserLookupPort,
  ) {}

  async execute({
    userId,
    conversationId,
  }: GetConversationQuery): Promise<ConversationResponseDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new ConversationNotFoundException(conversationId);
    conversation.ensureMember(userId);

    const otherId = conversation.otherParticipantId(userId);
    const [membership, job, application, otherParticipant, lastMessage] =
      await Promise.all([
        this.conversationRepository.findMembership(conversationId, userId),
        this.jobLookupPort.findById(conversation.jobId),
        this.applicationLookupPort.findById(conversation.applicationId),
        this.userLookupPort.findById(otherId),
        this.messageRepository.findLastMessage(conversationId),
      ]);

    const unreadCount = await this.messageRepository.countUnread(
      conversationId,
      userId,
      membership?.lastReadAt ?? null,
    );

    return ConversationResponseMapper.toDto(conversation, {
      jobTitle: job?.title ?? '',
      applicationStatus: application?.status ?? '',
      otherParticipant: otherParticipant!,
      lastMessage,
      unreadCount,
    });
  }
}
