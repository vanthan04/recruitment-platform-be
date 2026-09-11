import {
  CreateJobCommand,
  CreateJobHandler,
} from '@/modules/job/application/commands/create-job.command';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserLookupPort } from '@/modules/job/application/ports/user-lookup.port';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { ISkillLookupPort } from '@/modules/job/application/ports/skill-lookup.port';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import {
  CompanyProfileRequiredException,
  JobCategoryNotFoundException,
  JobSkillNotFoundException,
} from '@/modules/job/domain/exceptions/job.exceptions';

describe('CreateJobHandler', () => {
  let handler: CreateJobHandler;
  let jobRepository: jest.Mocked<IJobRepository>;
  let userLookup: jest.Mocked<IUserLookupPort>;
  let categoryLookup: jest.Mocked<ICategoryLookupPort>;
  let skillLookup: jest.Mocked<ISkillLookupPort>;

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
    userLookup = { getRecruiterCompanyId: jest.fn() };
    categoryLookup = { exists: jest.fn(), findManyByIds: jest.fn() };
    skillLookup = { findManyByIds: jest.fn() };

    handler = new CreateJobHandler(
      jobRepository,
      userLookup,
      categoryLookup,
      skillLookup,
    );
  });

  const baseInput = {
    title: 'Backend Developer',
    description: 'Build things',
    location: 'Ho Chi Minh City',
  };

  it('throws CompanyProfileRequiredException when the recruiter has no company', async () => {
    userLookup.getRecruiterCompanyId.mockResolvedValue(null);

    await expect(
      handler.execute(new CreateJobCommand('recruiter-1', baseInput)),
    ).rejects.toThrow(CompanyProfileRequiredException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('throws JobCategoryNotFoundException when categoryId does not exist', async () => {
    userLookup.getRecruiterCompanyId.mockResolvedValue('company-1');
    categoryLookup.exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new CreateJobCommand('recruiter-1', {
          ...baseInput,
          categoryId: 'cat-missing',
        }),
      ),
    ).rejects.toThrow(JobCategoryNotFoundException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('throws JobSkillNotFoundException listing exactly the missing skill ids', async () => {
    userLookup.getRecruiterCompanyId.mockResolvedValue('company-1');
    skillLookup.findManyByIds.mockResolvedValue(
      new Map([['skill-1', { id: 'skill-1', name: 'React', slug: 'react' }]]),
    );

    await expect(
      handler.execute(
        new CreateJobCommand('recruiter-1', {
          ...baseInput,
          skillIds: ['skill-1', 'skill-missing'],
        }),
      ),
    ).rejects.toThrow(JobSkillNotFoundException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('creates the job auto-opened, deduplicates skillIds, and defaults employmentType/workMode', async () => {
    userLookup.getRecruiterCompanyId.mockResolvedValue('company-1');
    skillLookup.findManyByIds.mockResolvedValue(
      new Map([['skill-1', { id: 'skill-1', name: 'React', slug: 'react' }]]),
    );
    jobRepository.save.mockImplementation(async (job) => job);

    const result = await handler.execute(
      new CreateJobCommand('recruiter-1', {
        ...baseInput,
        skillIds: ['skill-1', 'skill-1'],
      }),
    );

    expect(jobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        postedById: 'recruiter-1',
        status: JobStatus.OPEN,
      }),
      ['skill-1'],
    );
    expect(result.status).toBe(JobStatus.OPEN);
  });
});
