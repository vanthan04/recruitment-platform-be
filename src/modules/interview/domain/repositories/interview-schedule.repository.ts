import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';

export abstract class IInterviewScheduleRepository {
  abstract findById(id: string): Promise<InterviewSchedule | null>;
  abstract findByApplicationId(jobApplicationId: string): Promise<InterviewSchedule[]>;
  abstract save(interview: InterviewSchedule): Promise<InterviewSchedule>;
  abstract update(interview: InterviewSchedule): Promise<InterviewSchedule>;
}
