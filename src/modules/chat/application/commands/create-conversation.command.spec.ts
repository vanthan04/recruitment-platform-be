import { CreateConversationHandler } from '@/modules/chat/application/commands/create-conversation.command';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import {
  IChatApplicationLookupPort,
  ChatApplicationLookupResult,
} from '@/modules/chat/application/ports/application-lookup.port';
import {
  IChatJobLookupPort,
  ChatJobLookupResult,
} from '@/modules/chat/application/ports/job-lookup.port';
import {
  IChatUserLookupPort,
  ChatUserLookupResult,
} from '@/modules/chat/application/ports/user-lookup.port';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

function makeApplication(
  overrides: Partial<ChatApplicationLookupResult> = {},
): ChatApplicationLookupResult {
  return {
    id: 'app-1',
    status: 'HIRED',
    userId: 'candidate-1',
    jobId: 'job-1',
    ...overrides,
  };
}

function makeJob(
  overrides: Partial<ChatJobLookupResult> = {},
): ChatJobLookupResult {
  return {
    id: 'job-1',
    title: 'Backend Developer',
    postedById: 'recruiter-1',
    companyId: 'company-1',
    ...overrides,
  };
}

function makeUser(
  overrides: Partial<ChatUserLookupResult> = {},
): ChatUserLookupResult {
  return {
    id: 'candidate-1',
    fullName: 'Candidate One',
    avatarUrl: null,
    role: 'CANDIDATE',
    ...overrides,
  };
}

describe('CreateConversationHandler', () => {
  let handler: CreateConversationHandler;
  let conversationRepository: jest.Mocked<IConversationRepository>;
  let messageRepository: jest.Mocked<IMessageRepository>;
  let applicationLookupPort: jest.Mocked<IChatApplicationLookupPort>;
  let jobLookupPort: jest.Mocked<IChatJobLookupPort>;
  let userLookupPort: jest.Mocked<IChatUserLookupPort>;

  beforeEach(() => {
    conversationRepository = {
      findById: jest.fn(),
      findByApplicationId: jest.fn(),
      findOrCreateForApplication: jest.fn(),
      findManyForUser: jest.fn(),
      findMembership: jest.fn(),
      markMemberRead: jest.fn(),
      touchLastMessageAt: jest.fn(),
    };
    messageRepository = {
      findById: jest.fn(),
      findByClientMessageId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findPage: jest.fn(),
      findLastMessage: jest.fn().mockResolvedValue(null),
      countUnread: jest.fn(),
    };
    applicationLookupPort = { findById: jest.fn() };
    jobLookupPort = { findById: jest.fn() };
    userLookupPort = { findById: jest.fn() };

    handler = new CreateConversationHandler(
      conversationRepository,
      messageRepository,
      applicationLookupPort,
      jobLookupPort,
      userLookupPort,
    );
  });

  it('throws EntityNotFoundException when the application does not exist', async () => {
    applicationLookupPort.findById.mockResolvedValue(null);

    await expect(
      handler.execute({
        recruiterId: 'recruiter-1',
        applicationId: 'app-1',
      } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws BusinessRuleViolationException when the application is not HIRED', async () => {
    applicationLookupPort.findById.mockResolvedValue(
      makeApplication({ status: 'APPLIED' }),
    );

    await expect(
      handler.execute({
        recruiterId: 'recruiter-1',
        applicationId: 'app-1',
      } as any),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('throws UnauthorizedDomainException when the requester is not the job owner', async () => {
    applicationLookupPort.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue(
      makeJob({ postedById: 'someone-else' }),
    );

    await expect(
      handler.execute({
        recruiterId: 'recruiter-1',
        applicationId: 'app-1',
      } as any),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('is idempotent — a second call for the same application returns the existing conversation', async () => {
    applicationLookupPort.findById.mockResolvedValue(makeApplication());
    jobLookupPort.findById.mockResolvedValue(makeJob());
    userLookupPort.findById.mockResolvedValue(makeUser());

    const existing = new Conversation({
      id: 'conv-1',
      jobId: 'job-1',
      applicationId: 'app-1',
      candidateId: 'candidate-1',
      recruiterId: 'recruiter-1',
    });
    conversationRepository.findOrCreateForApplication.mockResolvedValue({
      conversation: existing,
      created: false,
    });

    const result = await handler.execute({
      recruiterId: 'recruiter-1',
      applicationId: 'app-1',
    } as any);

    expect(result.id).toBe('conv-1');
    expect(
      conversationRepository.findOrCreateForApplication,
    ).toHaveBeenCalledTimes(1);
  });
});
