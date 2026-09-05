import {
  CompleteInterviewHandler,
  CompleteInterviewCommand,
} from './complete-interview.command';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
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

describe('CompleteInterviewHandler', () => {
  let interviewRepository: jest.Mocked<IInterviewScheduleRepository>;
  let applicationLookupPort: jest.Mocked<IInterviewApplicationLookupPort>;
  let jobLookupPort: jest.Mocked<IInterviewJobLookupPort>;
  let handler: CompleteInterviewHandler;

  beforeEach(() => {
    interviewRepository = {
      findById: jest.fn(),
      findByApplicationId: jest.fn(),
      save: jest.fn((i) => Promise.resolve(i)),
      update: jest.fn((i) => Promise.resolve(i)),
    };
    applicationLookupPort = { findById: jest.fn() };
    jobLookupPort = { findById: jest.fn() };
    handler = new CompleteInterviewHandler(
      interviewRepository,
      applicationLookupPort,
      jobLookupPort,
    );
  });

  it('rejects completing when the application is already terminal', async () => {
    interviewRepository.findById.mockResolvedValue(makeInterview());
    applicationLookupPort.findById.mockResolvedValue({
      id: 'app-1',
      userId: 'candidate-1',
      jobId: 'job-1',
      status: 'REJECTED',
    });

    await expect(
      handler.execute(
        new CompleteInterviewCommand('recruiter-1', 'interview-1'),
      ),
    ).rejects.toThrow(InterviewApplicationNotInterviewableException);
    expect(jobLookupPort.findById).not.toHaveBeenCalled();
  });

  it('allows completing when the application is still in progress', async () => {
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

    await handler.execute(
      new CompleteInterviewCommand('recruiter-1', 'interview-1'),
    );

    expect(interviewRepository.update).toHaveBeenCalled();
  });
});
