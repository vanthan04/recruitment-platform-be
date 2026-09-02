import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewResponseDto } from '@/modules/interview/application/dto/interview-response.dto';

export class InterviewResponseMapper {
  static toDto(interview: InterviewSchedule): InterviewResponseDto {
    const dto = new InterviewResponseDto();
    dto.id = interview.id;
    dto.jobApplicationId = interview.jobApplicationId;
    dto.scheduledAt = interview.scheduledAt;
    dto.location = interview.location;
    dto.meetingLink = interview.meetingLink;
    dto.note = interview.note;
    dto.status = interview.status;
    dto.createdById = interview.createdById;
    dto.createdAt = interview.createdAt;
    dto.updatedAt = interview.updatedAt;
    return dto;
  }

  static toDtoList(interviews: InterviewSchedule[]): InterviewResponseDto[] {
    return interviews.map(InterviewResponseMapper.toDto);
  }
}
