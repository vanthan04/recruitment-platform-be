import { SendInterviewRemindersCron } from '@/modules/interview/application/jobs/send-interview-reminders.cron';
import { SendInterviewRemindersCommand } from '@/modules/interview/application/commands/send-interview-reminders.command';

describe('SendInterviewRemindersCron', () => {
  let commandBus: { execute: jest.Mock };
  let cron: SendInterviewRemindersCron;

  beforeEach(() => {
    commandBus = {
      execute: jest.fn().mockResolvedValue({ considered: 0, reminded: 0 }),
    };
    cron = new SendInterviewRemindersCron(commandBus as any);
  });

  it('dispatches a SendInterviewRemindersCommand', async () => {
    await cron.handle();

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(
      SendInterviewRemindersCommand,
    );
  });

  it('does not let a failing run escape — the next run should still happen', async () => {
    commandBus.execute.mockRejectedValue(new Error('db down'));
    await expect(cron.handle()).resolves.toBeUndefined();
  });
});
