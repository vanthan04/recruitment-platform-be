import {
  DeleteJobCommand,
  DeleteJobHandler,
} from '@/modules/job/application/commands/delete-job.command';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobNotFoundException } from '@/modules/job/domain/exceptions/job.exceptions';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

describe('DeleteJobHandler', () => {
  let handler: DeleteJobHandler;
  let jobRepository: jest.Mocked<IJobRepository>;

  function makeJob(overrides: Partial<Job> = {}) {
    return new Job({
      id: 'job-1',
      title: 'Backend Developer',
      description: 'Build things',
      companyId: 'company-1',
      location: 'Ho Chi Minh City',
      postedById: 'recruiter-1',
      ...overrides,
    });
  }

  beforeEach(() => {
    jobRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAllPaginated: jest.fn(),
      findAllByRecruiterPaginated: jest.fn(),
      findExpiredOpenJobs: jest.fn(),
      incrementViewCount: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new DeleteJobHandler(jobRepository);
  });

  it('throws JobNotFoundException when the job does not exist', async () => {
    jobRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteJobCommand('recruiter-1', 'job-1')),
    ).rejects.toThrow(JobNotFoundException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a recruiter who did not post the job', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());

    await expect(
      handler.execute(new DeleteJobCommand('some-other-recruiter', 'job-1')),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('soft-deletes the job (sets deletedAt, closes it) and persists via update()', async () => {
    const job = makeJob();
    jobRepository.findById.mockResolvedValue(job);

    await handler.execute(new DeleteJobCommand('recruiter-1', 'job-1'));

    expect(jobRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1', deletedAt: expect.any(Date) }),
    );
    expect(job.isDeleted).toBe(true);
  });
});
