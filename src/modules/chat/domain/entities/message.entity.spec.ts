import { Message } from '@/modules/chat/domain/entities/message.entity';
import { MessageType } from '@/modules/chat/domain/value-objects/message-type.vo';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return new Message({
    conversationId: 'conv-1',
    senderId: 'sender-1',
    content: 'Hello there',
    clientMessageId: 'client-1',
    ...overrides,
  });
}

describe('Message entity', () => {
  describe('ensureSender', () => {
    it('does not throw for the sender', () => {
      const message = makeMessage({ senderId: 'sender-1' });
      expect(() => message.ensureSender('sender-1')).not.toThrow();
    });

    it('throws UnauthorizedDomainException for a different user', () => {
      const message = makeMessage({ senderId: 'sender-1' });
      expect(() => message.ensureSender('sender-2')).toThrow(
        UnauthorizedDomainException,
      );
    });
  });

  describe('edit', () => {
    it('updates the content of a text message', () => {
      const message = makeMessage({ messageType: MessageType.TEXT });
      message.edit('Updated content');
      expect(message.content).toBe('Updated content');
    });

    it('throws when editing a non-text message', () => {
      const message = makeMessage({ messageType: MessageType.IMAGE });
      expect(() => message.edit('Updated')).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('throws when editing an empty message', () => {
      const message = makeMessage();
      expect(() => message.edit('   ')).toThrow(BusinessRuleViolationException);
    });

    it('throws when editing a deleted message', () => {
      const message = makeMessage();
      message.softDelete();
      expect(() => message.edit('Updated')).toThrow(
        BusinessRuleViolationException,
      );
    });
  });

  describe('softDelete', () => {
    it('marks the message deleted', () => {
      const message = makeMessage();
      message.softDelete();
      expect(message.isDeleted).toBe(true);
      expect(message.deletedAt).not.toBeNull();
    });

    it('throws when deleting an already-deleted message', () => {
      const message = makeMessage();
      message.softDelete();
      expect(() => message.softDelete()).toThrow(
        BusinessRuleViolationException,
      );
    });
  });

  describe('displayContent', () => {
    it('returns the real content when not deleted', () => {
      const message = makeMessage({ content: 'Real content' });
      expect(message.displayContent()).toBe('Real content');
    });

    it('returns a masked placeholder once deleted', () => {
      const message = makeMessage({ content: 'Secret content' });
      message.softDelete();
      expect(message.displayContent()).not.toContain('Secret content');
    });
  });
});
