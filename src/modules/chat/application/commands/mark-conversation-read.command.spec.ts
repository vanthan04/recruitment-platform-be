import { MarkConversationReadHandler } from '@/modules/chat/application/commands/mark-conversation-read.command';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
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

describe('MarkConversationReadHandler', () => {
  let handler: MarkConversationReadHandler;
  let conversationRepository: jest.Mocked<IConversationRepository>;

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
    handler = new MarkConversationReadHandler(conversationRepository);
  });

  it('throws EntityNotFoundException for an unknown conversation', async () => {
    conversationRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute({
        userId: 'candidate-1',
        conversationId: 'conv-1',
      } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws UnauthorizedDomainException for a non-member', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    await expect(
      handler.execute({ userId: 'stranger', conversationId: 'conv-1' } as any),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('marks the member as read for a valid member', async () => {
    conversationRepository.findById.mockResolvedValue(makeConversation());
    await handler.execute({
      userId: 'candidate-1',
      conversationId: 'conv-1',
    } as any);
    expect(conversationRepository.markMemberRead).toHaveBeenCalledWith(
      'conv-1',
      'candidate-1',
      expect.any(Date),
    );
  });
});
