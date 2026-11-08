import {
  GetUnreadMessageCountHandler,
  GetUnreadMessageCountQuery,
} from '@/modules/chat/application/queries/get-unread-message-count.query';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';

describe('GetUnreadMessageCountHandler', () => {
  let messageRepository: jest.Mocked<
    Pick<IMessageRepository, 'countUnreadForUser'>
  >;
  let handler: GetUnreadMessageCountHandler;

  beforeEach(() => {
    messageRepository = { countUnreadForUser: jest.fn() };
    handler = new GetUnreadMessageCountHandler(messageRepository as any);
  });

  it("returns the repository's total for the requesting user only", async () => {
    messageRepository.countUnreadForUser.mockResolvedValue(7);

    const result = await handler.execute(
      new GetUnreadMessageCountQuery('user-1'),
    );

    expect(result).toEqual({ count: 7 });
    expect(messageRepository.countUnreadForUser).toHaveBeenCalledWith('user-1');
  });

  it('returns zero when there is nothing unread', async () => {
    messageRepository.countUnreadForUser.mockResolvedValue(0);

    await expect(
      handler.execute(new GetUnreadMessageCountQuery('user-1')),
    ).resolves.toEqual({ count: 0 });
  });
});
