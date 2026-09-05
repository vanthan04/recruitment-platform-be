import { ChatGateway } from './chat.gateway';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';
import { UserSessionRevokedEvent } from '@/modules/user/infrastructure/events/user-session-revoked.event';

function makeSocket(overrides: Record<string, unknown> = {}) {
  return {
    id: 'socket-1',
    data: { userId: 'candidate-1' },
    handshake: { headers: {} },
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as any;
}

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

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let commandBus: { execute: jest.Mock };
  let conversationRepository: jest.Mocked<
    Pick<IConversationRepository, 'findById' | 'findManyForUser'>
  >;
  let server: {
    in: jest.Mock;
    to: jest.Mock;
    emit: jest.Mock;
    disconnectSockets: jest.Mock;
  };

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    conversationRepository = {
      findById: jest.fn(),
      findManyForUser: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    server = {
      in: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      disconnectSockets: jest.fn(),
    };

    gateway = new ChatGateway(
      {} as any,
      commandBus as any,
      conversationRepository as any,
      new ChatPresenceService(),
    );
    gateway.server = server as any;
  });

  describe('typing:start / typing:stop', () => {
    const CONVERSATION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('broadcasts to the conversation room for an actual member', async () => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      const client = makeSocket();

      await gateway.onTypingStart(client, {
        conversationId: CONVERSATION_ID,
      } as any);

      expect(client.to).toHaveBeenCalledWith(`conversation:${CONVERSATION_ID}`);
      expect(client.emit).toHaveBeenCalledWith('typing:start', {
        conversationId: CONVERSATION_ID,
        userId: 'candidate-1',
      });
    });

    it('does not broadcast for a user who is not a member of the conversation', async () => {
      conversationRepository.findById.mockResolvedValue(
        makeConversation({ candidateId: 'someone-else', recruiterId: 'and-someone-else' }),
      );
      const client = makeSocket({ data: { userId: 'stranger' } });

      await gateway.onTypingStart(client, {
        conversationId: CONVERSATION_ID,
      } as any);

      expect(client.to).not.toHaveBeenCalled();
    });

    it('does not broadcast when the conversationId fails validation', async () => {
      const client = makeSocket();

      await gateway.onTypingStart(client, { conversationId: 'not-a-uuid' } as any);

      expect(conversationRepository.findById).not.toHaveBeenCalled();
      expect(client.to).not.toHaveBeenCalled();
    });
  });

  describe('message:send', () => {
    it('emits message:error with the validation message for a malformed payload', async () => {
      const client = makeSocket();

      await gateway.onMessageSend(client, {
        conversationId: 'not-a-uuid',
        content: 'hi',
      } as any);

      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith(
        'message:error',
        expect.objectContaining({
          message: expect.stringContaining('conversationId'),
        }),
      );
    });

    it('forwards a DomainException message verbatim', async () => {
      commandBus.execute.mockRejectedValue(
        new ConversationNotFoundException('conv-1'),
      );
      const client = makeSocket();
      const payload = {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      };

      await gateway.onMessageSend(client, payload as any);

      expect(client.emit).toHaveBeenCalledWith('message:error', {
        clientMessageId: payload.clientMessageId,
        message: new ConversationNotFoundException('conv-1').message,
      });
    });

    it('replaces a raw internal error with a generic message instead of leaking it', async () => {
      commandBus.execute.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`conversationId`)'),
      );
      const client = makeSocket();
      const payload = {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      };

      await gateway.onMessageSend(client, payload as any);

      expect(client.emit).toHaveBeenCalledWith('message:error', {
        clientMessageId: payload.clientMessageId,
        message: 'Something went wrong, please try again',
      });
    });

    it('acks successfully for a valid payload', async () => {
      commandBus.execute.mockResolvedValue({ id: 'msg-1' });
      const client = makeSocket();
      const payload = {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      };

      await gateway.onMessageSend(client, payload as any);

      expect(client.emit).toHaveBeenCalledWith('message:ack', {
        clientMessageId: payload.clientMessageId,
        message: { id: 'msg-1' },
      });
    });

    it('rejects sends once the per-user rate limit is exceeded', async () => {
      commandBus.execute.mockResolvedValue({ id: 'msg-1' });
      const client = makeSocket();
      const send = (clientMessageId: string) =>
        gateway.onMessageSend(client, {
          conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          clientMessageId,
          content: 'hello',
        } as any);

      for (let i = 0; i < 20; i++) {
        await send(`b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${i.toString().padStart(2, '0')}`);
      }
      client.emit.mockClear();
      await send('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(commandBus.execute).toHaveBeenCalledTimes(20);
      expect(client.emit).toHaveBeenCalledWith(
        'message:error',
        expect.objectContaining({ message: expect.stringContaining('Too many') }),
      );
    });

    it('a second socket for the same user shares the same rate-limit budget (reconnect cannot bypass it)', async () => {
      commandBus.execute.mockResolvedValue({ id: 'msg-1' });
      const clientA = makeSocket({ id: 'socket-a' });
      const clientB = makeSocket({ id: 'socket-b' });

      for (let i = 0; i < 20; i++) {
        await gateway.onMessageSend(clientA, {
          conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          clientMessageId: `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${i.toString().padStart(2, '0')}`,
          content: 'hello',
        } as any);
      }
      await gateway.onMessageSend(clientB, {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      } as any);

      expect(clientB.emit).toHaveBeenCalledWith(
        'message:error',
        expect.objectContaining({ message: expect.stringContaining('Too many') }),
      );
    });
  });

  describe('handleSessionRevoked', () => {
    it('force-disconnects every socket in the revoked user\'s personal room', () => {
      gateway.handleSessionRevoked(new UserSessionRevokedEvent('candidate-1'));

      expect(server.in).toHaveBeenCalledWith('user:candidate-1');
      expect(server.disconnectSockets).toHaveBeenCalledWith(true);
    });
  });
});
