import {
  ListMyConversationsQuery,
  ListMyConversationsHandler,
} from '@/modules/chat/application/queries/list-my-conversations.query';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { IChatUserLookupPort } from '@/modules/chat/application/ports/user-lookup.port';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationMember } from '@/modules/chat/domain/entities/conversation-member.entity';
import { ChatParticipantRole } from '@/modules/chat/domain/value-objects/chat-participant-role.vo';

describe('ListMyConversationsHandler', () => {
  let handler: ListMyConversationsHandler;
  let conversationRepository: jest.Mocked<IConversationRepository>;
  let messageRepository: jest.Mocked<IMessageRepository>;
  let jobLookupPort: jest.Mocked<IChatJobLookupPort>;
  let applicationLookupPort: jest.Mocked<IChatApplicationLookupPort>;
  let userLookupPort: jest.Mocked<IChatUserLookupPort>;

  function makeRow(index: number) {
    const conversation = new Conversation({
      id: `conv-${index}`,
      jobId: `job-${index}`,
      applicationId: `app-${index}`,
      candidateId: 'user-1',
      recruiterId: `recruiter-${index}`,
    });
    const membership = new ConversationMember({
      id: `member-${index}`,
      conversationId: conversation.id,
      userId: 'user-1',
      role: ChatParticipantRole.CANDIDATE,
      lastReadAt: null,
    });
    return { conversation, membership };
  }

  beforeEach(() => {
    conversationRepository = {
      findById: jest.fn(),
      findByApplicationId: jest.fn(),
      findOrCreateForApplication: jest.fn(),
      findManyForUser: jest.fn(),
      findMembership: jest.fn(),
      markMemberRead: jest.fn(),
    };
    messageRepository = {
      findById: jest.fn(),
      findByClientMessageId: jest.fn(),
      createAndTouchConversation: jest.fn(),
      update: jest.fn(),
      findPage: jest.fn(),
      findLastMessage: jest.fn(),
      countUnread: jest.fn(),
      findLastMessages: jest.fn().mockResolvedValue(new Map()),
      countUnreadForConversations: jest.fn().mockResolvedValue(new Map()),
    };
    jobLookupPort = { findById: jest.fn(), findManyByIds: jest.fn() };
    applicationLookupPort = { findById: jest.fn(), findManyByIds: jest.fn() };
    userLookupPort = { findById: jest.fn(), findManyByIds: jest.fn() };

    handler = new ListMyConversationsHandler(
      conversationRepository,
      messageRepository,
      jobLookupPort,
      applicationLookupPort,
      userLookupPort,
    );
  });

  it('resolves job/application/user/message data with exactly one batched call each, regardless of page size', async () => {
    const rows = [makeRow(1), makeRow(2), makeRow(3)];
    conversationRepository.findManyForUser.mockResolvedValue({
      items: rows,
      total: 3,
    });
    jobLookupPort.findManyByIds.mockResolvedValue(
      new Map(
        rows.map(({ conversation }) => [
          conversation.jobId,
          {
            id: conversation.jobId,
            title: `Title for ${conversation.jobId}`,
            postedById: 'x',
            companyId: 'y',
          },
        ]),
      ),
    );
    applicationLookupPort.findManyByIds.mockResolvedValue(
      new Map(
        rows.map(({ conversation }) => [
          conversation.applicationId,
          {
            id: conversation.applicationId,
            status: 'PENDING',
            userId: 'user-1',
            jobId: conversation.jobId,
          },
        ]),
      ),
    );
    userLookupPort.findManyByIds.mockResolvedValue(
      new Map(
        rows.map(({ conversation }) => [
          conversation.recruiterId,
          {
            id: conversation.recruiterId,
            fullName: `Recruiter ${conversation.recruiterId}`,
            avatarUrl: null,
            role: 'RECRUITER',
          },
        ]),
      ),
    );

    const result = await handler.execute(
      new ListMyConversationsQuery('user-1', 1, 10),
    );

    expect(jobLookupPort.findManyByIds).toHaveBeenCalledTimes(1);
    expect(applicationLookupPort.findManyByIds).toHaveBeenCalledTimes(1);
    expect(userLookupPort.findManyByIds).toHaveBeenCalledTimes(1);
    expect(messageRepository.findLastMessages).toHaveBeenCalledTimes(1);
    expect(messageRepository.countUnreadForConversations).toHaveBeenCalledTimes(
      1,
    );
    expect(jobLookupPort.findById).not.toHaveBeenCalled();
    expect(applicationLookupPort.findById).not.toHaveBeenCalled();
    expect(userLookupPort.findById).not.toHaveBeenCalled();

    expect(result.conversations).toHaveLength(3);
    expect(result.conversations[0]).toMatchObject({
      id: 'conv-1',
      jobTitle: 'Title for job-1',
      applicationStatus: 'PENDING',
      otherParticipant: {
        id: 'recruiter-1',
        fullName: 'Recruiter recruiter-1',
      },
      unreadCount: 0,
      lastMessage: null,
    });
  });

  it('falls back to empty title/status and zero unread when a lookup misses', async () => {
    const rows = [makeRow(1)];
    conversationRepository.findManyForUser.mockResolvedValue({
      items: rows,
      total: 1,
    });
    jobLookupPort.findManyByIds.mockResolvedValue(new Map());
    applicationLookupPort.findManyByIds.mockResolvedValue(new Map());
    userLookupPort.findManyByIds.mockResolvedValue(
      new Map([
        [
          'recruiter-1',
          {
            id: 'recruiter-1',
            fullName: 'Recruiter One',
            avatarUrl: null,
            role: 'RECRUITER',
          },
        ],
      ]),
    );

    const result = await handler.execute(
      new ListMyConversationsQuery('user-1', 1, 10),
    );

    expect(result.conversations[0]).toMatchObject({
      jobTitle: '',
      applicationStatus: '',
      unreadCount: 0,
    });
  });
});
