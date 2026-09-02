import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return new Conversation({
    jobId: 'job-1',
    applicationId: 'app-1',
    candidateId: 'candidate-1',
    recruiterId: 'recruiter-1',
    ...overrides,
  });
}

describe('Conversation entity', () => {
  describe('isMember / ensureMember', () => {
    it('treats the candidate and recruiter as members', () => {
      const conversation = makeConversation();
      expect(conversation.isMember('candidate-1')).toBe(true);
      expect(conversation.isMember('recruiter-1')).toBe(true);
      expect(conversation.isMember('someone-else')).toBe(false);
    });

    it('throws UnauthorizedDomainException for a non-member', () => {
      const conversation = makeConversation();
      expect(() => conversation.ensureMember('someone-else')).toThrow(
        UnauthorizedDomainException,
      );
    });
  });

  describe('otherParticipantId', () => {
    it('returns the recruiter when called as the candidate', () => {
      const conversation = makeConversation();
      expect(conversation.otherParticipantId('candidate-1')).toBe(
        'recruiter-1',
      );
    });

    it('returns the candidate when called as the recruiter', () => {
      const conversation = makeConversation();
      expect(conversation.otherParticipantId('recruiter-1')).toBe(
        'candidate-1',
      );
    });

    it('throws for a non-member', () => {
      const conversation = makeConversation();
      expect(() => conversation.otherParticipantId('someone-else')).toThrow(
        UnauthorizedDomainException,
      );
    });
  });

  describe('touch', () => {
    it('updates lastMessageAt', () => {
      const conversation = makeConversation({ lastMessageAt: null });
      const at = new Date('2026-01-01T00:00:00Z');
      conversation.touch(at);
      expect(conversation.lastMessageAt).toBe(at);
    });
  });
});
