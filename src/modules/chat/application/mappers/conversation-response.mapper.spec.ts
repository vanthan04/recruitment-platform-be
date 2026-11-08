import { ConversationResponseMapper } from '@/modules/chat/application/mappers/conversation-response.mapper';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';

function toDto(applicationStatus: string) {
  return ConversationResponseMapper.toDto(
    new Conversation({
      id: 'conv-1',
      jobId: 'job-1',
      applicationId: 'app-1',
      candidateId: 'candidate-1',
      recruiterId: 'recruiter-1',
    }),
    {
      jobTitle: 'Backend Developer',
      applicationStatus,
      otherParticipant: {
        id: 'recruiter-1',
        fullName: 'Recruiter One',
        avatarUrl: null,
        role: 'RECRUITER',
      },
      lastMessage: null,
      unreadCount: 0,
      otherLastReadAt: null,
    },
  );
}

describe('ConversationResponseMapper — isReadOnly', () => {
  it.each(['REJECTED', 'WITHDRAWN'])(
    'is read-only when the application is %s',
    (status) => {
      expect(toDto(status).isReadOnly).toBe(true);
    },
  );

  it.each(['SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'])(
    'is writable while the application is %s',
    (status) => {
      expect(toDto(status).isReadOnly).toBe(false);
    },
  );

  it('is writable when the status could not be resolved (empty string)', () => {
    // List/get queries fall back to '' when the application lookup misses —
    // that must not silently lock a conversation (the write path re-checks).
    expect(toDto('').isReadOnly).toBe(false);
  });
});
