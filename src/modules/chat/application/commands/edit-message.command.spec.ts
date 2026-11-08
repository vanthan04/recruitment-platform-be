import { EditMessageHandler } from '@/modules/chat/application/commands/edit-message.command';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageAttachment } from '@/modules/chat/domain/entities/message-attachment.entity';
import { MESSAGE_UPDATED_EVENT } from '@/modules/chat/infrastructure/events/message-updated.event';
import {
  ConversationNotFoundException,
  ConversationClosedException,
  MessageNotFoundException,
  NotMessageSenderException,
  CannotEditDeletedMessageException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return new Message({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'candidate-1',
    content: 'original',
    clientMessageId: 'client-1',
    ...overrides,
  });
}

function makeConversation(): Conversation {
  return new Conversation({
    id: 'conv-1',
    jobId: 'job-1',
    applicationId: 'app-1',
    candidateId: 'candidate-1',
    recruiterId: 'recruiter-1',
  });
}

describe('EditMessageHandler', () => {
  let handler: EditMessageHandler;
  let messageRepository: jest.Mocked<
    Pick<IMessageRepository, 'findById' | 'update'>
  >;
  let conversationRepository: jest.Mocked<
    Pick<IConversationRepository, 'findById'>
  >;
  let eventEmitter: { emit: jest.Mock };
  let urlResolver: { resolve: jest.Mock };
  let applicationLookupPort: { findById: jest.Mock };

  beforeEach(() => {
    messageRepository = {
      findById: jest.fn(),
      update: jest.fn().mockImplementation((m: Message) => Promise.resolve(m)),
    };
    conversationRepository = {
      findById: jest.fn().mockResolvedValue(makeConversation()),
    };
    eventEmitter = { emit: jest.fn() };
    urlResolver = {
      resolve: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
    };

    applicationLookupPort = {
      findById: jest.fn().mockResolvedValue({
        id: 'app-1',
        status: 'INTERVIEW',
        userId: 'candidate-1',
        jobId: 'job-1',
      }),
    };

    handler = new EditMessageHandler(
      messageRepository as any,
      conversationRepository as any,
      eventEmitter as any,
      urlResolver as any,
      applicationLookupPort as any,
    );
  });

  it.each(['REJECTED', 'WITHDRAWN'])(
    'refuses to edit once the application is %s, without saving or emitting',
    async (status) => {
      messageRepository.findById.mockResolvedValue(makeMessage());
      applicationLookupPort.findById.mockResolvedValue({
        id: 'app-1',
        status,
        userId: 'candidate-1',
        jobId: 'job-1',
      });

      await expect(
        handler.execute({
          userId: 'candidate-1',
          messageId: 'msg-1',
          content: 'x',
        } as any),
      ).rejects.toThrow(ConversationClosedException);
      expect(messageRepository.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    },
  );

  it('throws MessageNotFoundException for an unknown message', async () => {
    messageRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute({
        userId: 'candidate-1',
        messageId: 'msg-1',
        content: 'x',
      } as any),
    ).rejects.toThrow(MessageNotFoundException);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rejects an edit from someone other than the sender, without emitting', async () => {
    messageRepository.findById.mockResolvedValue(makeMessage());
    await expect(
      handler.execute({
        userId: 'recruiter-1',
        messageId: 'msg-1',
        content: 'x',
      } as any),
    ).rejects.toThrow(NotMessageSenderException);
    expect(messageRepository.update).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws ConversationNotFoundException when the parent conversation is gone', async () => {
    messageRepository.findById.mockResolvedValue(makeMessage());
    conversationRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute({
        userId: 'candidate-1',
        messageId: 'msg-1',
        content: 'x',
      } as any),
    ).rejects.toThrow(ConversationNotFoundException);
  });

  it('does not emit when the edit itself is refused (deleted message)', async () => {
    messageRepository.findById.mockResolvedValue(
      makeMessage({ deletedAt: new Date() }),
    );
    await expect(
      handler.execute({
        userId: 'candidate-1',
        messageId: 'msg-1',
        content: 'x',
      } as any),
    ).rejects.toThrow(CannotEditDeletedMessageException);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('persists the edit and emits MESSAGE_UPDATED_EVENT addressed to the other participant', async () => {
    messageRepository.findById.mockResolvedValue(makeMessage());

    const dto = await handler.execute({
      userId: 'candidate-1',
      messageId: 'msg-1',
      content: '  edited  ',
    } as any);

    expect(dto.content).toBe('edited');
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    const [name, event] = eventEmitter.emit.mock.calls[0];
    expect(name).toBe(MESSAGE_UPDATED_EVENT);
    expect(event).toMatchObject({
      conversationId: 'conv-1',
      senderId: 'candidate-1',
      recipientId: 'recruiter-1',
    });
    expect(event.message.content).toBe('edited');
  });

  it('resolves attachment keys into signed URLs before returning/broadcasting', async () => {
    messageRepository.findById.mockResolvedValue(
      makeMessage({
        attachments: [
          new MessageAttachment({
            fileName: 'cv.pdf',
            fileUrl: 'chat-attachments/raw-key',
            mimeType: 'application/pdf',
            fileSize: 10,
            messageId: 'msg-1',
          }),
        ],
      }),
    );
    urlResolver.resolve.mockImplementation((dto) => {
      dto.attachments[0].fileUrl = 'https://signed.example/cv.pdf';
      return Promise.resolve(dto);
    });

    const dto = await handler.execute({
      userId: 'candidate-1',
      messageId: 'msg-1',
      content: 'edited',
    } as any);

    expect(dto.attachments[0].fileUrl).toBe('https://signed.example/cv.pdf');
    const event = eventEmitter.emit.mock.calls[0][1];
    expect(event.message.attachments[0].fileUrl).toBe(
      'https://signed.example/cv.pdf',
    );
  });
});
