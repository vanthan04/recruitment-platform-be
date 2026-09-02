import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

function makeJob(overrides: Partial<Job> = {}): Job {
  return new Job({
    title: 'Backend Developer',
    description: 'Build APIs',
    companyId: 'company-1',
    location: 'Remote',
    salary: new SalaryRange(null, null),
    requirements: null,
    benefits: null,
    expiresAt: null,
    postedById: 'recruiter-1',
    ...overrides,
  });
}

describe('Job entity', () => {
  describe('open/close/reopen', () => {
    it('starts as DRAFT and can be opened', () => {
      const job = makeJob();
      expect(job.status).toBe(JobStatus.DRAFT);
      job.open();
      expect(job.status).toBe(JobStatus.OPEN);
    });

    it('throws when opening an already-open job', () => {
      const job = makeJob({ status: JobStatus.OPEN });
      expect(() => job.open()).toThrow(BusinessRuleViolationException);
    });

    it('closes an open job', () => {
      const job = makeJob({ status: JobStatus.OPEN });
      job.close();
      expect(job.status).toBe(JobStatus.CLOSED);
    });

    it('throws when closing an already-closed job', () => {
      const job = makeJob({ status: JobStatus.CLOSED });
      expect(() => job.close()).toThrow(BusinessRuleViolationException);
    });

    it('reopens a closed job', () => {
      const job = makeJob({ status: JobStatus.CLOSED });
      job.reopen();
      expect(job.status).toBe(JobStatus.OPEN);
    });

    it('throws when reopening a job that is not closed', () => {
      const job = makeJob({ status: JobStatus.DRAFT });
      expect(() => job.reopen()).toThrow(BusinessRuleViolationException);
    });
  });

  describe('ensureOwner', () => {
    it('does not throw for the owning recruiter', () => {
      const job = makeJob({ postedById: 'recruiter-1' });
      expect(() => job.ensureOwner('recruiter-1')).not.toThrow();
    });

    it('throws UnauthorizedDomainException for a different recruiter', () => {
      const job = makeJob({ postedById: 'recruiter-1' });
      expect(() => job.ensureOwner('recruiter-2')).toThrow(UnauthorizedDomainException);
    });
  });

  describe('isExpired / isOpen', () => {
    it('is not expired when expiresAt is null', () => {
      const job = makeJob({ expiresAt: null });
      expect(job.isExpired).toBe(false);
    });

    it('is expired when expiresAt is in the past', () => {
      const job = makeJob({ expiresAt: new Date('2000-01-01') });
      expect(job.isExpired).toBe(true);
    });

    it('is open only when status is OPEN, not expired, and not deleted', () => {
      const job = makeJob({ status: JobStatus.OPEN, expiresAt: new Date('2999-01-01') });
      expect(job.isOpen).toBe(true);
    });

    it('is not open when expired even if status is OPEN', () => {
      const job = makeJob({ status: JobStatus.OPEN, expiresAt: new Date('2000-01-01') });
      expect(job.isOpen).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('marks the job deleted and closes it', () => {
      const job = makeJob({ status: JobStatus.OPEN });
      job.softDelete();
      expect(job.isDeleted).toBe(true);
      expect(job.status).toBe(JobStatus.CLOSED);
    });

    it('throws when deleting an already-deleted job', () => {
      const job = makeJob();
      job.softDelete();
      expect(() => job.softDelete()).toThrow(BusinessRuleViolationException);
    });
  });
});
