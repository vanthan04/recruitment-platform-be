import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
import { InvalidApplicationStatusTransitionException } from '@/modules/application/domain/exceptions/application.exceptions';

function makeApplication(status?: ApplicationStatus): JobApplication {
  return new JobApplication({
    userId: 'user-1',
    jobId: 'job-1',
    cvId: 'cv-1',
    coverLetter: null,
    status,
  });
}

describe('JobApplication entity', () => {
  it('defaults to APPLIED on creation', () => {
    expect(makeApplication().status).toBe(ApplicationStatus.APPLIED);
  });

  describe('transitionTo', () => {
    it('walks the full forward pipeline', () => {
      const app = makeApplication();
      app.transitionTo(ApplicationStatus.SCREENING);
      expect(app.status).toBe(ApplicationStatus.SCREENING);
      app.transitionTo(ApplicationStatus.SHORTLISTED);
      expect(app.status).toBe(ApplicationStatus.SHORTLISTED);
      app.transitionTo(ApplicationStatus.INTERVIEW);
      expect(app.status).toBe(ApplicationStatus.INTERVIEW);
      app.transitionTo(ApplicationStatus.OFFER);
      expect(app.status).toBe(ApplicationStatus.OFFER);
      app.transitionTo(ApplicationStatus.HIRED);
      expect(app.status).toBe(ApplicationStatus.HIRED);
    });

    it('allows REJECTED from any non-terminal step', () => {
      const app = makeApplication(ApplicationStatus.INTERVIEW);
      app.transitionTo(ApplicationStatus.REJECTED);
      expect(app.status).toBe(ApplicationStatus.REJECTED);
    });

    it('rejects skipping a stage', () => {
      const app = makeApplication(ApplicationStatus.APPLIED);
      expect(() => app.transitionTo(ApplicationStatus.INTERVIEW)).toThrow(
        InvalidApplicationStatusTransitionException,
      );
    });

    it('rejects moving out of a terminal status', () => {
      const app = makeApplication(ApplicationStatus.HIRED);
      expect(() => app.transitionTo(ApplicationStatus.SCREENING)).toThrow(
        InvalidApplicationStatusTransitionException,
      );
    });

    it('rejects moving backwards', () => {
      const app = makeApplication(ApplicationStatus.SHORTLISTED);
      expect(() => app.transitionTo(ApplicationStatus.APPLIED)).toThrow(
        InvalidApplicationStatusTransitionException,
      );
    });
  });

  describe('withdraw', () => {
    it('withdraws from a non-terminal status', () => {
      const app = makeApplication(ApplicationStatus.SCREENING);
      app.withdraw();
      expect(app.status).toBe(ApplicationStatus.WITHDRAWN);
    });

    it('throws when withdrawing an already-terminal application', () => {
      const app = makeApplication(ApplicationStatus.HIRED);
      expect(() => app.withdraw()).toThrow(
        InvalidApplicationStatusTransitionException,
      );
    });
  });
});
