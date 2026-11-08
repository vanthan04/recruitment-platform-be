import { ensureConversationOpen } from '@/modules/chat/application/utils/ensure-conversation-open.util';
import {
  ChatApplicationNotFoundException,
  ConversationClosedException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

function lookupReturning(status: string | null) {
  return {
    findById: jest
      .fn()
      .mockResolvedValue(
        status === null
          ? null
          : { id: 'app-1', status, userId: 'candidate-1', jobId: 'job-1' },
      ),
    findManyByIds: jest.fn(),
  } as any;
}

describe('ensureConversationOpen', () => {
  it.each(['SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'])(
    'passes while the application is %s',
    async (status) => {
      await expect(
        ensureConversationOpen(lookupReturning(status), 'app-1'),
      ).resolves.toBeUndefined();
    },
  );

  it.each(['REJECTED', 'WITHDRAWN'])(
    'throws ConversationClosedException once the application is %s',
    async (status) => {
      await expect(
        ensureConversationOpen(lookupReturning(status), 'app-1'),
      ).rejects.toThrow(ConversationClosedException);
    },
  );

  it('throws ChatApplicationNotFoundException when the application is missing', async () => {
    await expect(
      ensureConversationOpen(lookupReturning(null), 'app-1'),
    ).rejects.toThrow(ChatApplicationNotFoundException);
  });

  it('looks the application up by the id it was given', async () => {
    const lookup = lookupReturning('INTERVIEW');
    await ensureConversationOpen(lookup, 'app-42');
    expect(lookup.findById).toHaveBeenCalledWith('app-42');
  });
});
