import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMessageHandler } from '@/modules/chat/application/commands/create-message.command';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MESSAGE_SENT_EVENT } from '@/modules/chat/infrastructure/events/message-sent.event';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return new Conversation({
    id: 'conv-1',
    jobId: 'job-1',
    applicationId: 'app-1',
    candidateId: 'candidate-1',
    recruiterId: 'recruiter-1',
    ...overrides,
  });
}

describe('CreateMessageHandler', () => {
  let handler: CreateMessageHandler;
  let conversationRepository: jest.Mocked<IConversationRepository>;
  let messageRepository: jest.Mocked<IMessageRepository>;
  let jobLookupPort: jest.Mocked<IChatJobLookupPort>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

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
      findLastMessage: jest.fn(),
      countUnread: jest.fn(),
    };
    jobLookupPort = {
      findById: jest.fn().mockResolvedValue({
        id: 'job-1',
        title: 'Backend Developer',
        postedById: 'recruiter-1',
        companyId: 'company-1',
      }),
    };
    eventEmitter = { emit: jest.fn() } as any;

    handler = new CreateMessageHandler(
      conversationRepository,
      messageRepository,
      jobLookupPort,
      eventEmitter,
    );
  });

  it('throws EntityNotFoundException when the conversation does not exist', async () => {
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute({
        senderId: 'candidate-1',
        conversationId: 'conv-1',
        clientMessageId: 'c-1',
        content: 'hi',
        messageType: MessageType.TEXT,
        attachments: [],
      } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws UnauthorizedDomainException when the sender is not a member', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());

    await expect(
      handler.execute({
        senderId: 'stranger',
        conversationId: 'conv-1',
        clientMessageId: 'c-1',
        content: 'hi',
        messageType: MessageType.TEXT,
        attachments: [],
      } as any),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('is idempotent — a duplicate clientMessageId returns the existing message without creating a new one', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    const existing = new Message({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'candidate-1',
      content: 'hi',
      clientMessageId: 'c-1',
    });
    messageRepository.findByClientMessageId.mockResolvedValue(existing);

    const result = await handler.execute({
      senderId: 'candidate-1',
      conversationId: 'conv-1',
      clientMessageId: 'c-1',
      content: 'hi',
      messageType: MessageType.TEXT,
      attachments: [],
    } as any);

    expect(result.id).toBe('msg-1');
    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a client-sent SYSTEM message', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    messageRepository.findByClientMessageId.mockResolvedValue(null);

    await expect(
      handler.execute({
        senderId: 'candidate-1',
        conversationId: 'conv-1',
        clientMessageId: 'c-1',
        content: 'hi',
        messageType: MessageType.SYSTEM,
        attachments: [],
      } as any),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('rejects an empty message with no attachments', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    messageRepository.findByClientMessageId.mockResolvedValue(null);

    await expect(
      handler.execute({
        senderId: 'candidate-1',
        conversationId: 'conv-1',
        clientMessageId: 'c-1',
        content: '   ',
        messageType: MessageType.TEXT,
        attachments: [],
      } as any),
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it('persists the message, touches the conversation, and emits MESSAGE_SENT_EVENT', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    messageRepository.findByClientMessageId.mockResolvedValue(null);
    const saved = new Message({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'candidate-1',
      content: 'hi',
      clientMessageId: 'c-1',
    });
    messageRepository.create.mockResolvedValue(saved);

    const result = await handler.execute({
      senderId: 'candidate-1',
      conversationId: 'conv-1',
      clientMessageId: 'c-1',
      content: 'hi',
      messageType: MessageType.TEXT,
      attachments: [],
    } as any);

    expect(result.id).toBe('msg-1');
    expect(conversationRepository.touchLastMessageAt).toHaveBeenCalledWith(
      'conv-1',
      saved.createdAt,
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      MESSAGE_SENT_EVENT,
      expect.objectContaining({
        messageId: 'msg-1',
        recipientId: 'recruiter-1',
        senderId: 'candidate-1',
      }),
    );
  });
});
