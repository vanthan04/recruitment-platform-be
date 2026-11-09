import { EventEmitter2 } from '@nestjs/event-emitter';
import { InterviewScheduleInfraRepository } from './interview-schedule.infra-repository';
import { InterviewSchedulePrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-schedule-prisma.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';
import {
  INTERVIEW_ROOM_CLOSED_EVENT,
  InterviewRoomClosedEvent,
} from '@/modules/interview/infrastructure/events/interview-room-closed.event';

function makeInterview(status: InterviewStatus) {
  return new InterviewSchedule({
    id: 'interview-1',
    jobApplicationId: 'app-1',
    scheduledAt: new Date(Date.now() + 3600_000),
    location: 'Office',
    status,
  });
}

describe('InterviewScheduleInfraRepository.update', () => {
  let prisma: jest.Mocked<Pick<InterviewSchedulePrismaRepository, 'update'>>;
  let events: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let repository: InterviewScheduleInfraRepository;

  beforeEach(() => {
    prisma = { update: jest.fn() };
    events = { emit: jest.fn() };
    repository = new InterviewScheduleInfraRepository(
      prisma as unknown as InterviewSchedulePrismaRepository,
      events as unknown as EventEmitter2,
    );
  });

  const persist = (interview: InterviewSchedule) => {
    prisma.update.mockResolvedValue({
      id: interview.id,
      scheduledAt: interview.scheduledAt,
      durationMinutes: null,
      location: interview.location,
      meetingLink: null,
      useRoom: false,
      note: null,
      status: interview.status,
      reminderSentAt: null,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      jobApplicationId: interview.jobApplicationId,
      createdById: null,
    });
    return repository.update(interview);
  };

  it.each([
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.NO_SHOW,
  ])(
    'announces the room closing when the interview becomes %s',
    async (status) => {
      await persist(makeInterview(status));

      expect(events.emit).toHaveBeenCalledWith(
        INTERVIEW_ROOM_CLOSED_EVENT,
        new InterviewRoomClosedEvent('interview-1'),
      );
    },
  );

  it.each([InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED])(
    'stays silent while the interview is still %s',
    async (status) => {
      await persist(makeInterview(status));

      expect(events.emit).not.toHaveBeenCalled();
    },
  );
});
