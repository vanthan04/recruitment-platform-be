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

    const conversations = await Promise.all(
      items.map(async ({ conversation, membership }) => {
        const otherId = conversation.otherParticipantId(userId);
        const [job, application, otherParticipant, lastMessage, unreadCount] =
          await Promise.all([
            this.jobLookupPort.findById(conversation.jobId),
            this.applicationLookupPort.findById(conversation.applicationId),
            this.userLookupPort.findById(otherId),
            this.messageRepository.findLastMessage(conversation.id),
            this.messageRepository.countUnread(
              conversation.id,
              userId,
              membership.lastReadAt,
            ),
          ]);

        return ConversationResponseMapper.toDto(conversation, {
          jobTitle: job?.title ?? '',
          applicationStatus: application?.status ?? '',
          otherParticipant: otherParticipant!,
          lastMessage,
          unreadCount,
        });
      }),
    );

    return { conversations, total, page, limit };
  }
}
