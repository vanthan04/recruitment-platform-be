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
      findBatch: jest.fn().mockResolvedValue([]),
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

  /** Makes findBatch return `searches` on the first page, then an empty page to end the loop. */
  function mockSingleBatch(searches: SavedSearch[]) {
    savedSearchRepository.findBatch
      .mockResolvedValueOnce(searches)
      .mockResolvedValueOnce([]);
  }

  it('sends no email when there are no saved searches', async () => {
    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('skips a saved search with no newly matching jobs', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [],
      total: 0,
    });

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(userLookupPort.findById).not.toHaveBeenCalled();
    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('skips sending when the saved-search owner no longer exists', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [{ title: 'Backend Dev', location: 'Remote', companyName: 'Acme' }],
      total: 1,
    });
    userLookupPort.findById.mockResolvedValue(null);

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).not.toHaveBeenCalled();
  });

  it('emails the user a digest of new matching jobs, using the real total in the subject', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [
        { title: 'Backend Dev', location: 'Remote', companyName: 'Acme' },
        { title: 'API Engineer', location: 'HCMC', companyName: null },
      ],
      total: 2,
    });
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

  it('notes the true match count when it exceeds the displayed items (digest was truncated upstream)', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [{ title: 'Backend Dev', location: 'Remote', companyName: 'Acme' }],
      total: 36,
    });
    userLookupPort.findById.mockResolvedValue({ email: 'user@example.com' });

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(mailPort.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '36 new job(s) matching your saved search',
        html: expect.stringContaining('and 35 more'),
      }),
    );
  });

  it('sends one digest per matching saved search across multiple users', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
      new SavedSearch({ id: 'ss-2', userId: 'user-2', keyword: 'frontend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [{ title: 'A Job', location: 'Remote', companyName: 'Acme' }],
      total: 1,
    });
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

  it('continues processing subsequent saved searches after one fails (per-recipient isolation)', async () => {
    mockSingleBatch([
      new SavedSearch({ id: 'ss-1', userId: 'user-1', keyword: 'backend' }),
      new SavedSearch({ id: 'ss-2', userId: 'user-2', keyword: 'frontend' }),
    ]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [{ title: 'A Job', location: 'Remote', companyName: 'Acme' }],
      total: 1,
    });
    userLookupPort.findById.mockResolvedValue({ email: 'user@example.com' });
    mailPort.sendEmail
      .mockRejectedValueOnce(new Error('SMTP rejected recipient'))
      .mockResolvedValueOnce(undefined);

    await expect(
      handler.execute(new SendJobAlertDigestsCommand()),
    ).resolves.toBeUndefined();

    expect(mailPort.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('pages through multiple batches via the cursor until an empty page is returned', async () => {
    const firstBatch = Array.from(
      { length: 2 },
      (_, i) =>
        new SavedSearch({ id: `ss-${i}`, userId: `user-${i}`, keyword: 'x' }),
    );
    savedSearchRepository.findBatch
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce([]);
    jobSearchPort.findRecentMatchingJobs.mockResolvedValue({
      items: [],
      total: 0,
    });

    await handler.execute(new SendJobAlertDigestsCommand());

    expect(savedSearchRepository.findBatch).toHaveBeenCalledTimes(2);
    expect(savedSearchRepository.findBatch).toHaveBeenNthCalledWith(1, {
      cursor: undefined,
      take: expect.any(Number),
    });
    expect(savedSearchRepository.findBatch).toHaveBeenNthCalledWith(2, {
      cursor: 'ss-1',
      take: expect.any(Number),
    });
  });
});
