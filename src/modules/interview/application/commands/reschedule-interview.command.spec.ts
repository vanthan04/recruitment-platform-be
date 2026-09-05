import {
  RescheduleInterviewHandler,
  RescheduleInterviewCommand,
} from './reschedule-interview.command';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewApplicationNotInterviewableException } from '@/modules/interview/domain/exceptions/interview.exceptions';

function makeInterview(): InterviewSchedule {
  return new InterviewSchedule({
    id: 'interview-1',
    jobApplicationId: 'app-1',
    scheduledAt: new Date(Date.now() + 86400000),
    location: 'Office',
    createdById: 'recruiter-1',
  });
}

describe('RescheduleInterviewHandler', () => {
  let interviewRepository: jest.Mocked<IInterviewScheduleRepository>;
  let applicationLookupPort: jest.Mocked<IInterviewApplicationLookupPort>;
  let jobLookupPort: jest.Mocked<IInterviewJobLookupPort>;
  let userLookupPort: jest.Mocked<IInterviewUserLookupPort>;
  let mailPort: jest.Mocked<IInterviewMailPort>;
  let handler: RescheduleInterviewHandler;

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
    handler = new RescheduleInterviewHandler(
      interviewRepository,
      applicationLookupPort,
      jobLookupPort,
      userLookupPort,
      mailPort,
    );
  });

  it('rejects rescheduling when the application is already terminal', async () => {
    interviewRepository.findById.mockResolvedValue(makeInterview());
    applicationLookupPort.findById.mockResolvedValue({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      status: 'HIRED',
    });

    await expect(
      handler.execute(
        new RescheduleInterviewCommand('recruiter-1', 'interview-1', {
          scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        }),
      ),
    ).rejects.toThrow(InterviewApplicationNotInterviewableException);
    expect(jobLookupPort.findById).not.toHaveBeenCalled();
  });

  it('allows rescheduling when the application is still in progress', async () => {
    interviewRepository.findById.mockResolvedValue(makeInterview());
    applicationLookupPort.findById.mockResolvedValue({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      status: 'INTERVIEW',
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
      new RescheduleInterviewCommand('recruiter-1', 'interview-1', {
        scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      }),
    );

    expect(interviewRepository.update).toHaveBeenCalled();
  });
});
