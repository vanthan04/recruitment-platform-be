import {
  CloseJobCommand,
  CloseJobHandler,
} from '@/modules/job/application/commands/close-job.command';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import {
  JobNotFoundException,
  JobAlreadyClosedException,
} from '@/modules/job/domain/exceptions/job.exceptions';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

describe('CloseJobHandler', () => {
  let handler: CloseJobHandler;
  let jobRepository: jest.Mocked<IJobRepository>;

  function makeJob(overrides: Partial<Job> = {}) {
    return new Job({
      id: 'job-1',
      title: 'Backend Developer',
      description: 'Build things',
      companyId: 'company-1',
      location: 'Ho Chi Minh City',
      postedById: 'recruiter-1',
      status: JobStatus.OPEN,
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

    handler = new CloseJobHandler(jobRepository);
  });

  it('throws JobNotFoundException when the job does not exist', async () => {
    jobRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new CloseJobCommand('recruiter-1', 'job-1')),
    ).rejects.toThrow(JobNotFoundException);
  });

  it('rejects a recruiter who did not post the job', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());

    await expect(
      handler.execute(new CloseJobCommand('some-other-recruiter', 'job-1')),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('throws JobAlreadyClosedException when the job is already closed', async () => {
    jobRepository.findById.mockResolvedValue(
      makeJob({ status: JobStatus.CLOSED }),
    );

    await expect(
      handler.execute(new CloseJobCommand('recruiter-1', 'job-1')),
    ).rejects.toThrow(JobAlreadyClosedException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('closes an open job and returns the updated DTO', async () => {
    const job = makeJob();
    jobRepository.findById.mockResolvedValue(job);
    jobRepository.update.mockImplementation(async (j) => j);

    const result = await handler.execute(
      new CloseJobCommand('recruiter-1', 'job-1'),
    );

    expect(jobRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1', status: JobStatus.CLOSED }),
    );
    expect(result.status).toBe(JobStatus.CLOSED);
  });
});
