import {
  ScheduleInterviewHandler,
  ScheduleInterviewCommand,
} from './schedule-interview.command';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import { InterviewApplicationNotInterviewableException } from '@/modules/interview/domain/exceptions/interview.exceptions';

describe('ScheduleInterviewHandler', () => {
  let interviewRepository: jest.Mocked<IInterviewScheduleRepository>;
  let applicationLookupPort: jest.Mocked<IInterviewApplicationLookupPort>;
  let jobLookupPort: jest.Mocked<IInterviewJobLookupPort>;
  let userLookupPort: jest.Mocked<IInterviewUserLookupPort>;
  let mailPort: jest.Mocked<IInterviewMailPort>;
  let handler: ScheduleInterviewHandler;

  beforeEach(() => {
    interviewRepository = {
      findById: jest.fn(),
      findByApplicationId: jest.fn(),
      save: jest.fn((i) => Promise.resolve(i)),
      update: jest.fn((i) => Promise.resolve(i)),
    };
    applicationLookupPort = { findById: jest.fn() };
    jobLookupPort = { findById: jest.fn() };
    userLookupPort = { findById: jest.fn() };
    mailPort = { sendEmail: jest.fn() };
    handler = new ScheduleInterviewHandler(
      interviewRepository,
      applicationLookupPort,
      jobLookupPort,
      userLookupPort,
      mailPort,
    );
  });

  it('rejects scheduling an interview for an already-terminal application', async () => {
    applicationLookupPort.findById.mockResolvedValue({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      status: 'REJECTED',
    });

    await expect(
      handler.execute(
        new ScheduleInterviewCommand('recruiter-1', {
          jobApplicationId: 'app-1',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          location: 'Office',
        }),
      ),
    ).rejects.toThrow(InterviewApplicationNotInterviewableException);
    expect(jobLookupPort.findById).not.toHaveBeenCalled();
  });

  it('allows scheduling for a non-terminal application', async () => {
    applicationLookupPort.findById.mockResolvedValue({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      status: 'SHORTLISTED',
    });
    jobLookupPort.findById.mockResolvedValue({
      id: 'job-1',
      title: 'Backend Developer',
      postedById: 'recruiter-1',
    });
    userLookupPort.findById.mockResolvedValue({
      id: 'candidate-1',
      email: 'candidate@example.com',
      fullName: 'Candidate',
    });

    await handler.execute(
      new ScheduleInterviewCommand('recruiter-1', {
        jobApplicationId: 'app-1',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        location: 'Office',
      }),
    );

    expect(interviewRepository.save).toHaveBeenCalled();
  });
});
