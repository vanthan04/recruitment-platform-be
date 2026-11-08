import { CreateSystemMessageHandler } from '@/modules/chat/application/commands/create-system-message.command';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import { MESSAGE_SENT_EVENT } from '@/modules/chat/infrastructure/events/message-sent.event';
import {
  ConversationNotFoundException,
  NotConversationMemberException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

function makeConversation(): Conversation {
  return new Conversation({
    id: 'conv-1',
    jobId: 'job-1',
    applicationId: 'app-1',
    candidateId: 'candidate-1',
    recruiterId: 'recruiter-1',
  });
}

describe('CreateSystemMessageHandler', () => {
  let handler: CreateSystemMessageHandler;
  let conversationRepository: jest.Mocked<
    Pick<IConversationRepository, 'findById'>
  >;
  let messageRepository: jest.Mocked<
    Pick<
      IMessageRepository,
      'findByClientMessageId' | 'createAndTouchConversation'
    >
  >;
  let jobLookupPort: { findById: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const run = (senderId = 'recruiter-1') =>
    handler.execute({
      conversationId: 'conv-1',
      senderId,
      content: 'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
      clientMessageId: 'system:application-status:app-1:INTERVIEW',
    } as any);

  beforeEach(() => {
    conversationRepository = {
      findById: jest.fn().mockResolvedValue(makeConversation()),
    };
    messageRepository = {
      findByClientMessageId: jest.fn().mockResolvedValue(null),
      createAndTouchConversation: jest
        .fn()
        .mockImplementation((m: Message) => Promise.resolve(m)),
    };
    jobLookupPort = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'job-1', title: 'Backend Dev' }),
    };
    eventEmitter = { emit: jest.fn() };

    handler = new CreateSystemMessageHandler(
      conversationRepository as any,
      messageRepository as any,
      jobLookupPort as any,
      eventEmitter as any,
    );
  });

  it('throws ConversationNotFoundException for an unknown conversation', async () => {
    conversationRepository.findById.mockResolvedValue(null);
    await expect(run()).rejects.toThrow(ConversationNotFoundException);
    expect(messageRepository.createAndTouchConversation).not.toHaveBeenCalled();
  });

  it('refuses a sender who is not a member of the conversation', async () => {
    await expect(run('stranger')).rejects.toThrow(
      NotConversationMemberException,
    );
    expect(messageRepository.createAndTouchConversation).not.toHaveBeenCalled();
  });

  it('stores the line as a SYSTEM message with the given idempotency key', async () => {
    await run();

    const saved = messageRepository.createAndTouchConversation.mock.calls[0][0];
    expect(saved).toMatchObject({
      conversationId: 'conv-1',
      senderId: 'recruiter-1',
      messageType: MessageType.SYSTEM,
      clientMessageId: 'system:application-status:app-1:INTERVIEW',
      content: 'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
    });
  });

  it('broadcasts through MESSAGE_SENT_EVENT, addressed to the other participant', async () => {
    const dto = await run();

    expect(dto.messageType).toBe(MessageType.SYSTEM);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    const [name, event] = eventEmitter.emit.mock.calls[0];
    expect(name).toBe(MESSAGE_SENT_EVENT);
    expect(event).toMatchObject({
      conversationId: 'conv-1',
      senderId: 'recruiter-1',
      recipientId: 'candidate-1',
      jobTitle: 'Backend Dev',
    });
  });

  it('is idempotent — a redelivered event returns the existing line without posting or broadcasting again', async () => {
    messageRepository.findByClientMessageId.mockResolvedValue(
      new Message({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'recruiter-1',
        content: 'x',
        messageType: MessageType.SYSTEM,
        clientMessageId: 'system:application-status:app-1:INTERVIEW',
      }),
    );

    const dto = await run();

    expect(dto.id).toBe('msg-1');
    expect(messageRepository.createAndTouchConversation).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('posts even though the conversation is read-only — that is when the closing line matters', async () => {
    // No application lookup is involved at all: the handler has no way to
    // refuse on account of a REJECTED/WITHDRAWN application.
    await expect(run()).resolves.toMatchObject({
      messageType: MessageType.SYSTEM,
    });
  });
});
