import { DeleteMessageHandler } from '@/modules/chat/application/commands/delete-message.command';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MESSAGE_DELETED_EVENT } from '@/modules/chat/infrastructure/events/message-deleted.event';
import {
  MessageNotFoundException,
  NotMessageSenderException,
  MessageAlreadyDeletedException,
  SystemMessageNotDeletableException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return new Message({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'recruiter-1',
    content: 'secret',
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

describe('DeleteMessageHandler', () => {
  let handler: DeleteMessageHandler;
  let messageRepository: jest.Mocked<
    Pick<IMessageRepository, 'findById' | 'update'>
  >;
  let conversationRepository: jest.Mocked<
    Pick<IConversationRepository, 'findById'>
  >;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    messageRepository = {
      findById: jest.fn(),
      update: jest.fn().mockImplementation((m: Message) => Promise.resolve(m)),
    };
    conversationRepository = {
      findById: jest.fn().mockResolvedValue(makeConversation()),
    };
    eventEmitter = { emit: jest.fn() };

    handler = new DeleteMessageHandler(
      messageRepository as any,
      conversationRepository as any,
      eventEmitter as any,
    );
  });

  it('throws MessageNotFoundException for an unknown message', async () => {
    messageRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute({ userId: 'recruiter-1', messageId: 'msg-1' } as any),
    ).rejects.toThrow(MessageNotFoundException);
  });

  it('rejects a delete from someone other than the sender, without emitting', async () => {
    messageRepository.findById.mockResolvedValue(makeMessage());
    await expect(
      handler.execute({ userId: 'candidate-1', messageId: 'msg-1' } as any),
    ).rejects.toThrow(NotMessageSenderException);
    expect(messageRepository.update).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('does not emit again for an already-deleted message', async () => {
    messageRepository.findById.mockResolvedValue(
      makeMessage({ deletedAt: new Date() }),
    );
    await expect(
      handler.execute({ userId: 'recruiter-1', messageId: 'msg-1' } as any),
    ).rejects.toThrow(MessageAlreadyDeletedException);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('refuses to delete a system message even though its "sender" asks, without saving or emitting', async () => {
    messageRepository.findById.mockResolvedValue(
      makeMessage({ messageType: MessageType.SYSTEM }),
    );

    await expect(
      handler.execute({ userId: 'recruiter-1', messageId: 'msg-1' } as any),
    ).rejects.toThrow(SystemMessageNotDeletableException);
    expect(messageRepository.update).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('soft-deletes and emits a masked MESSAGE_DELETED_EVENT for the other participant', async () => {
    messageRepository.findById.mockResolvedValue(makeMessage());

    const dto = await handler.execute({
      userId: 'recruiter-1',
      messageId: 'msg-1',
    } as any);

    expect(dto.isDeleted).toBe(true);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    const [name, event] = eventEmitter.emit.mock.calls[0];
    expect(name).toBe(MESSAGE_DELETED_EVENT);
    expect(event).toMatchObject({
      conversationId: 'conv-1',
      senderId: 'recruiter-1',
      recipientId: 'candidate-1',
    });
    // The original content must never leave the server in the broadcast.
    expect(event.message.content).not.toBe('secret');
    expect(event.message.attachments).toEqual([]);
  });
});
