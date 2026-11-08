import { ApplicationStatusSystemMessageListener } from './application-status-system-message.listener';
import { CreateSystemMessageCommand } from '@/modules/chat/application/commands/create-system-message.command';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ApplicationStatusChangedEvent } from '@/modules/application/infrastructure/events/application-status-changed.event';
import { ApplicationWithdrawnEvent } from '@/modules/application/infrastructure/events/application-withdrawn.event';

describe('ApplicationStatusSystemMessageListener', () => {
  let conversationRepository: { findByApplicationId: jest.Mock };
  let commandBus: { execute: jest.Mock };
  let listener: ApplicationStatusSystemMessageListener;

  const event = new ApplicationStatusChangedEvent(
    'app-1',
    'candidate-1',
    'job-1',
    'Backend Dev',
    'INTERVIEW',
  );

  beforeEach(() => {
    conversationRepository = {
      findByApplicationId: jest.fn().mockResolvedValue(
        new Conversation({
          id: 'conv-1',
          jobId: 'job-1',
          applicationId: 'app-1',
          candidateId: 'candidate-1',
          recruiterId: 'recruiter-1',
        }),
      ),
    };
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    listener = new ApplicationStatusSystemMessageListener(
      conversationRepository as any,
      commandBus as any,
    );
  });

  it('posts a status line into the conversation, attributed to its recruiter', async () => {
    await listener.handleStatusChanged(event);

    expect(conversationRepository.findByApplicationId).toHaveBeenCalledWith(
      'app-1',
    );
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateSystemMessageCommand);
    expect(command).toMatchObject({
      conversationId: 'conv-1',
      senderId: 'recruiter-1',
      content: 'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
      clientMessageId: 'system:application-status:app-1:INTERVIEW',
    });
  });

  it('does nothing when no conversation was ever opened for the application', async () => {
    conversationRepository.findByApplicationId.mockResolvedValue(null);

    await listener.handleStatusChanged(event);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('swallows a failure to post (the status change already committed) instead of crashing the process', async () => {
    commandBus.execute.mockRejectedValue(new Error('db down'));
    await expect(listener.handleStatusChanged(event)).resolves.toBeUndefined();
  });

  it('swallows a failure to look the conversation up', async () => {
    conversationRepository.findByApplicationId.mockRejectedValue(
      new Error('db down'),
    );
    await expect(listener.handleStatusChanged(event)).resolves.toBeUndefined();
  });

  describe('when the candidate withdraws', () => {
    const withdrawn = new ApplicationWithdrawnEvent(
      'app-1',
      'candidate-1',
      'job-1',
    );

    it('posts a WITHDRAWN line attributed to the candidate, so it counts as unread for the recruiter', async () => {
      await listener.handleWithdrawn(withdrawn);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(CreateSystemMessageCommand);
      expect(command).toMatchObject({
        conversationId: 'conv-1',
        senderId: 'candidate-1',
        content: 'Đơn ứng tuyển đã chuyển sang trạng thái "Đã rút đơn".',
        clientMessageId: 'system:application-status:app-1:WITHDRAWN',
      });
    });

    it('does nothing when no conversation was ever opened', async () => {
      conversationRepository.findByApplicationId.mockResolvedValue(null);

      await listener.handleWithdrawn(withdrawn);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('swallows a failure instead of crashing the process', async () => {
      commandBus.execute.mockRejectedValue(new Error('db down'));
      await expect(
        listener.handleWithdrawn(withdrawn),
      ).resolves.toBeUndefined();
    });
  });
});
