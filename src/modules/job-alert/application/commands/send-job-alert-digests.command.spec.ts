import {
  SendJobAlertDigestsCommand,
  SendJobAlertDigestsHandler,
} from '@/modules/job-alert/application/commands/send-job-alert-digests.command';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { IJobSearchPort } from '@/modules/job-alert/application/ports/job-search.port';
import { IUserLookupPort } from '@/modules/job-alert/application/ports/user-lookup.port';
import { IMailPort } from '@/modules/job-alert/application/ports/mail.port';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';

describe('SendJobAlertDigestsHandler', () => {
  let handler: SendJobAlertDigestsHandler;
  let savedSearchRepository: jest.Mocked<ISavedSearchRepository>;
  let jobSearchPort: jest.Mocked<IJobSearchPort>;
  let userLookupPort: jest.Mocked<IUserLookupPort>;
  let mailPort: jest.Mocked<IMailPort>;

  beforeEach(() => {
    savedSearchRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    jobSearchPort = { findRecentMatchingJobs: jest.fn() };
    userLookupPort = { findById: jest.fn() };
    mailPort = { sendEmail: jest.fn() };

    handler = new SendJobAlertDigestsHandler(
      savedSearchRepository,
      jobSearchPort,
      userLookupPort,
      mailPort,
    );
  });

  it('sends no email when there are no saved searches', async () => {
    savedSearchRepository.findAll.mockResolvedValue([]);

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('skips a saved search with no newly matching jobs', async () => {
    savedSearchRepository.findAll.mockResolvedValue([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue([]);

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(userLookupPort.findById).not.toHaveBeenCalled();
    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('skips sending when the saved-search owner no longer exists', async () => {
    savedSearchRepository.findAll.mockResolvedValue([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue([
      { title: 'Backend Dev', location: 'Remote', companyName: 'Acme' },
    ]);
    userLookupPort.findById.mockResolvedValue(null);

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('emails the user a digest of new matching jobs', async () => {
    savedSearchRepository.findAll.mockResolvedValue([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue([
      { title: 'Backend Dev', location: 'Remote', companyName: 'Acme' },
      { title: 'API Engineer', location: 'HCMC', companyName: null },
    ]);
    userLookupPort.findById.mockResolvedValue({ email: 'user@example.com' });

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: '2 new job(s) matching your saved search',
        html: expect.stringContaining('Backend Dev'),
      }),
    );
  });

  it('sends one digest per matching saved search across multiple users', async () => {
    savedSearchRepository.findAll.mockResolvedValue([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
      new SavedSearch({ id: 'ss-2', userId: 'user-2', keyword: 'frontend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue([
      { title: 'A Job', location: 'Remote', companyName: 'Acme' },
    ]);
    userLookupPort.findById.mockImplementation(async (id) => ({
      email: `${id}@example.com`,
    }));

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).toHaveBeenCalledTimes(2);
    expect(mailPort.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user-1@example.com' }),
    );
    expect(mailPort.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user-2@example.com' }),
    );
  });
});
