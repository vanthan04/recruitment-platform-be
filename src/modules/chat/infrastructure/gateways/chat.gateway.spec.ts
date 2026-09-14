import { ChatGateway } from './chat.gateway';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import { ChatRateLimiterService } from '@/modules/chat/infrastructure/services/chat-rate-limiter.service';
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
  let rateLimiter: jest.Mocked<
    Pick<
      ChatRateLimiterService,
      'consumeSendQuota' | 'consumeReadQuota' | 'clearInMemoryQuota'
    >
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
    // Rate-limiting's own sliding-window/Redis-vs-in-memory correctness is
    // covered by chat-rate-limiter.service.spec.ts — here it's just a
    // dependency the gateway delegates to and reacts on the result of.
    rateLimiter = {
      consumeSendQuota: jest.fn().mockResolvedValue(true),
      consumeReadQuota: jest.fn().mockResolvedValue(true),
      clearInMemoryQuota: jest.fn(),
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
      rateLimiter as any,
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
      });

      expect(client.to).toHaveBeenCalledWith(`conversation:${CONVERSATION_ID}`);
      expect(client.emit).toHaveBeenCalledWith('typing:start', {
        conversationId: CONVERSATION_ID,
        userId: 'candidate-1',
      });
    });

    it('does not broadcast for a user who is not a member of the conversation', async () => {
      conversationRepository.findById.mockResolvedValue(
        makeConversation({
          candidateId: 'someone-else',
          recruiterId: 'and-someone-else',
        }),
      );
      const client = makeSocket({ data: { userId: 'stranger' } });

      await gateway.onTypingStart(client, {
        conversationId: CONVERSATION_ID,
      });

      expect(client.to).not.toHaveBeenCalled();
    });

    it('does not broadcast when the conversationId fails validation', async () => {
      const client = makeSocket();

      await gateway.onTypingStart(client, {
        conversationId: 'not-a-uuid',
      });

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
      });

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

      await gateway.onMessageSend(client, payload);

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

      await gateway.onMessageSend(client, payload);

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

      await gateway.onMessageSend(client, payload);

      expect(client.emit).toHaveBeenCalledWith('message:ack', {
        clientMessageId: payload.clientMessageId,
        message: { id: 'msg-1' },
      });
    });

    it('rejects the send and does not dispatch the command when the rate limiter denies it', async () => {
      rateLimiter.consumeSendQuota.mockResolvedValue(false);
      const client = makeSocket();

      await gateway.onMessageSend(client, {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      });

      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith(
        'message:error',
        expect.objectContaining({
          message: expect.stringContaining('Too many'),
        }),
      );
    });

    it('checks the rate limiter under the sending user, not the socket', async () => {
      commandBus.execute.mockResolvedValue({ id: 'msg-1' });
      const client = makeSocket({ data: { userId: 'candidate-42' } });

      await gateway.onMessageSend(client, {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientMessageId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content: 'hello',
      });

      expect(rateLimiter.consumeSendQuota).toHaveBeenCalledWith('candidate-42');
    });
  });

  describe('handleDisconnect', () => {
    it("clears the user's rate-limit budget once their last socket disconnects", async () => {
      const client = makeSocket({ id: 'socket-a' });

      // Seed presence as if this socket had been active (handleConnection
      // itself does a real JWT/cookie auth check that's out of scope here).
      (gateway as any).presenceService.addSocket('candidate-1', 'socket-a');

      await gateway.handleDisconnect(client);

      expect(rateLimiter.clearInMemoryQuota).toHaveBeenCalledWith(
        'candidate-1',
      );
    });

    it('does not clear the budget while the user still has another connected socket', async () => {
      const clientA = makeSocket({ id: 'socket-a' });
      const clientB = makeSocket({ id: 'socket-b' });

      (gateway as any).presenceService.addSocket('candidate-1', 'socket-a');
      (gateway as any).presenceService.addSocket('candidate-1', 'socket-b');

      await gateway.handleDisconnect(clientA);

      expect(rateLimiter.clearInMemoryQuota).not.toHaveBeenCalled();

      await gateway.handleDisconnect(clientB);

      expect(rateLimiter.clearInMemoryQuota).toHaveBeenCalledWith(
        'candidate-1',
      );
    });
  });

  describe('handleSessionRevoked', () => {
    it("force-disconnects every socket in the revoked user's personal room", () => {
      gateway.handleSessionRevoked(new UserSessionRevokedEvent('candidate-1'));

      expect(server.in).toHaveBeenCalledWith('user:candidate-1');
      expect(server.disconnectSockets).toHaveBeenCalledWith(true);
    });
  });
});
