import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';

export class InterviewScheduleMapper {
  static toDomain(raw: any): InterviewSchedule | null {
    if (!raw) return null;

    return new InterviewSchedule({
      id: raw.id,
      scheduledAt: raw.scheduledAt,
      location: raw.location,
      meetingLink: raw.meetingLink,
      note: raw.note,
      status: raw.status as InterviewStatus,
      jobApplicationId: raw.jobApplicationId,
      createdById: raw.createdById,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(interview: InterviewSchedule): any {
    return {
      scheduledAt: interview.scheduledAt,
      location: interview.location,
      meetingLink: interview.meetingLink,
      note: interview.note,
      status: interview.status,
      jobApplicationId: interview.jobApplicationId,
      createdById: interview.createdById,
    };
  }
}
