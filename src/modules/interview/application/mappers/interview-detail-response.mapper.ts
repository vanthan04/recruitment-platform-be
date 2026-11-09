import { InterviewListItem } from '@/modules/interview/domain/repositories/interview-read.repository';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewResponseMapper } from '@/modules/interview/application/mappers/interview-response.mapper';
import {
  InterviewDetailResponseDto,
  InterviewSessionResponseDto,
  InterviewViewerRole,
} from '@/modules/interview/application/dto/interview-detail-response.dto';

export class InterviewDetailResponseMapper {
  static toDto(
    item: InterviewListItem,
    viewerRole: InterviewViewerRole,
  ): InterviewDetailResponseDto {
    return Object.assign(
      new InterviewDetailResponseDto(),
      InterviewResponseMapper.toDto(item.interview),
      {
        jobId: item.jobId,
        jobTitle: item.jobTitle,
        candidateId: item.candidateId,
        candidateName: item.candidateName,
        viewerRole,
        inProgress: Boolean(item.openSessionId),
      },
    );
  }

  static sessionToDto(session: InterviewSession): InterviewSessionResponseDto {
    const dto = new InterviewSessionResponseDto();
    dto.id = session.id;
    dto.interviewId = session.interviewId;
    dto.startedAt = session.startedAt;
    dto.endedAt = session.endedAt;
    dto.startedById = session.startedById;
    dto.monitoringConsentAt = session.monitoringConsentAt;
    dto.status = session.isOpen() ? 'IN_PROGRESS' : 'ENDED';
    return dto;
  }
}
