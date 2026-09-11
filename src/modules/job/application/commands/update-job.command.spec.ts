import {
  UpdateJobCommand,
  UpdateJobHandler,
} from '@/modules/job/application/commands/update-job.command';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { ISkillLookupPort } from '@/modules/job/application/ports/skill-lookup.port';
import { Job } from '@/modules/job/domain/entities/job.entity';
import {
  JobNotFoundException,
  JobCategoryNotFoundException,
  JobSkillNotFoundException,
} from '@/modules/job/domain/exceptions/job.exceptions';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

describe('UpdateJobHandler', () => {
  let handler: UpdateJobHandler;
  let jobRepository: jest.Mocked<IJobRepository>;
  let categoryLookup: jest.Mocked<ICategoryLookupPort>;
  let skillLookup: jest.Mocked<ISkillLookupPort>;

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
    categoryLookup = { exists: jest.fn(), findManyByIds: jest.fn() };
    skillLookup = { findManyByIds: jest.fn() };

    handler = new UpdateJobHandler(jobRepository, categoryLookup, skillLookup);
  });

  it('throws JobNotFoundException when the job does not exist', async () => {
    jobRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateJobCommand('recruiter-1', 'job-1', {})),
    ).rejects.toThrow(JobNotFoundException);
  });

  it('rejects a recruiter who did not post the job', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());

    await expect(
      handler.execute(
        new UpdateJobCommand('some-other-recruiter', 'job-1', {
          title: 'Hijacked title',
        }),
      ),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('throws JobCategoryNotFoundException for a non-existent categoryId', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());
    categoryLookup.exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new UpdateJobCommand('recruiter-1', 'job-1', {
          categoryId: 'cat-missing',
        }),
      ),
    ).rejects.toThrow(JobCategoryNotFoundException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('throws JobSkillNotFoundException for a non-existent skillId', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());
    skillLookup.findManyByIds.mockResolvedValue(new Map());

    await expect(
      handler.execute(
        new UpdateJobCommand('recruiter-1', 'job-1', {
          skillIds: ['skill-missing'],
        }),
      ),
    ).rejects.toThrow(JobSkillNotFoundException);
    expect(jobRepository.update).not.toHaveBeenCalled();
  });

  it('updates the job details and passes deduplicated skillIds through', async () => {
    const job = makeJob();
    jobRepository.findById.mockResolvedValue(job);
    skillLookup.findManyByIds.mockResolvedValue(
      new Map([['skill-1', { id: 'skill-1', name: 'React', slug: 'react' }]]),
    );
    jobRepository.update.mockImplementation(async (j) => j);

    const result = await handler.execute(
      new UpdateJobCommand('recruiter-1', 'job-1', {
        title: 'Senior Backend Developer',
        skillIds: ['skill-1', 'skill-1'],
      }),
    );

    expect(jobRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        title: 'Senior Backend Developer',
      }),
      ['skill-1'],
    );
    expect(result.title).toBe('Senior Backend Developer');
  });

  it('leaves skills untouched (passes undefined) when skillIds is not provided', async () => {
    jobRepository.findById.mockResolvedValue(makeJob());
    jobRepository.update.mockImplementation(async (j) => j);

    await handler.execute(
      new UpdateJobCommand('recruiter-1', 'job-1', { title: 'New title' }),
    );

    expect(jobRepository.update).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
    );
    expect(skillLookup.findManyByIds).not.toHaveBeenCalled();
  });
});
