import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplyJobUseCase } from '@/modules/application/application/use-cases/apply-job.use-case';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { JOB_APPLIED_EVENT } from '@/modules/application/infrastructure/events/job-applied.event';
import { EntityNotFoundException, DuplicateEntityException } from '@/common/exceptions/domain.exception';

function makeOpenJob(overrides: Partial<Job> = {}): Job {
  return new Job({
    id: 'job-1',
    title: 'Backend Developer',
    description: 'Build APIs',
    companyId: 'company-1',
    location: 'Remote',
    status: JobStatus.OPEN,
    salary: new SalaryRange(null, null),
    requirements: null,
    benefits: null,
    expiresAt: null,
    postedById: 'recruiter-1',
    ...overrides,
  });
}

function makePublishedCv(overrides: Partial<Cv> = {}): Cv {
  return new Cv({
    id: 'cv-1',
    title: 'My CV',
    summary: null,
    userId: 'candidate-1',
    status: CvStatus.PUBLISHED,
    ...overrides,
  });
}

describe('ApplyJobUseCase', () => {
  let useCase: ApplyJobUseCase;
  let applicationRepository: jest.Mocked<IJobApplicationRepository>;
  let jobRepository: jest.Mocked<IJobRepository>;
  let cvRepository: jest.Mocked<ICvRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    applicationRepository = {
      findById: jest.fn(),
      findByUserIdAndJobId: jest.fn(),
      findAllByJobId: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      countByJobIdGroupedByStatus: jest.fn(),
    };
    jobRepository = {
      findById: jest.fn(),
      findAllPaginated: jest.fn(),
      findAllByRecruiter: jest.fn(),
      findExpiredOpenJobs: jest.fn(),
      incrementViewCount: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    cvRepository = {
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() } as any;

    useCase = new ApplyJobUseCase(applicationRepository, jobRepository, cvRepository, eventEmitter);
  });

  it('throws EntityNotFoundException when the job does not exist', async () => {
    jobRepository.findById.mockResolvedValue(null);
    cvRepository.findById.mockResolvedValue(makePublishedCv());

    await expect(
      useCase.execute('candidate-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException when the CV does not exist', async () => {
    jobRepository.findById.mockResolvedValue(makeOpenJob());
    cvRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('candidate-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws when the CV is not published', async () => {
    jobRepository.findById.mockResolvedValue(makeOpenJob());
    cvRepository.findById.mockResolvedValue(makePublishedCv({ status: CvStatus.DRAFT }));

    await expect(
      useCase.execute('candidate-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow();
  });

  it('throws when a different candidate owns the CV', async () => {
    jobRepository.findById.mockResolvedValue(makeOpenJob());
    cvRepository.findById.mockResolvedValue(makePublishedCv({ userId: 'someone-else' }));

    await expect(
      useCase.execute('candidate-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow();
  });

  it('throws DuplicateEntityException when already applied to the job', async () => {
    jobRepository.findById.mockResolvedValue(makeOpenJob());
    cvRepository.findById.mockResolvedValue(makePublishedCv());
    applicationRepository.findByUserIdAndJobId.mockResolvedValue({ id: 'existing-app' } as any);

    await expect(
      useCase.execute('candidate-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow(DuplicateEntityException);
  });

  it('saves the application and emits job.applied on success', async () => {
    const job = makeOpenJob();
    jobRepository.findById.mockResolvedValue(job);
    cvRepository.findById.mockResolvedValue(makePublishedCv());
    applicationRepository.findByUserIdAndJobId.mockResolvedValue(null);
    applicationRepository.save.mockImplementation(async (app) => ({ ...app, id: 'app-1' }) as any);

    const result = await useCase.execute('candidate-1', {
      jobId: 'job-1',
      cvId: 'cv-1',
      coverLetter: 'Hire me',
    });

    expect(result.id).toBe('app-1');
    expect(applicationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'candidate-1', jobId: 'job-1', cvId: 'cv-1' }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      JOB_APPLIED_EVENT,
      expect.objectContaining({
        applicationId: 'app-1',
        userId: 'candidate-1',
        recruiterId: 'recruiter-1',
      }),
    );
  });
});
