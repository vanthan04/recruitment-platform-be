import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { IChatUserLookupPort } from '@/modules/chat/application/ports/user-lookup.port';
import { ConversationResponseMapper } from '@/modules/chat/application/mappers/conversation-response.mapper';
import { ConversationResponseDto } from '@/modules/chat/application/dto/conversation-response.dto';

export class ListMyConversationsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

export interface ListMyConversationsResult {
  conversations: ConversationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(ListMyConversationsQuery)
export class ListMyConversationsHandler implements IQueryHandler<
  ListMyConversationsQuery,
  ListMyConversationsResult
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
    page,
    limit,
  }: ListMyConversationsQuery): Promise<ListMyConversationsResult> {
    const { items, total } = await this.conversationRepository.findManyForUser(
      userId,
      page,
      limit,
    );

    const conversationIds = items.map(({ conversation }) => conversation.id);
    const jobIds = items.map(({ conversation }) => conversation.jobId);
    const applicationIds = items.map(
      ({ conversation }) => conversation.applicationId,
    );
    const otherIds = items.map(({ conversation }) =>
      conversation.otherParticipantId(userId),
    );

    const [jobs, applications, otherParticipants, lastMessages, unreadCounts] =
      await Promise.all([
        this.jobLookupPort.findManyByIds(jobIds),
        this.applicationLookupPort.findManyByIds(applicationIds),
        this.userLookupPort.findManyByIds(otherIds),
        this.messageRepository.findLastMessages(conversationIds),
        this.messageRepository.countUnreadForConversations(
          items.map(({ conversation, membership }) => ({
            conversationId: conversation.id,
            since: membership.lastReadAt,
          })),
          userId,
        ),
      ]);

    const conversations = items.map(({ conversation }) => {
      const otherId = conversation.otherParticipantId(userId);
      return ConversationResponseMapper.toDto(conversation, {
        jobTitle: jobs.get(conversation.jobId)?.title ?? '',
        applicationStatus:
          applications.get(conversation.applicationId)?.status ?? '',
        otherParticipant: otherParticipants.get(otherId)!,
        lastMessage: lastMessages.get(conversation.id) ?? null,
        unreadCount: unreadCounts.get(conversation.id) ?? 0,
      });
    });

    return { conversations, total, page, limit };
  }
}
