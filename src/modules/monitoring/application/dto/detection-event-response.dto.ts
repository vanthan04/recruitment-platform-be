import { DetectionEvent } from '@/modules/monitoring/domain/entities/detection-event.entity';
import { MonitoringEventType } from '@/modules/monitoring/domain/services/event-rules';
import { InterviewParticipantRole } from '@/modules/monitoring/application/ports/interview-access.port';

export class DetectionEventResponseDto {
  id: string;
  sessionId: string;
  eventType: MonitoringEventType;
  objectClass: string;
  confidence: number;
  detectedAt: Date;
  /** Null while the event is still open. */
  endedAt: Date | null;
  durationMs: number | null;
  frameCount: number;
  metadata: Record<string, unknown> | null;
  reviewedAt: Date | null;
  /** Recruiter-only (the review is the recruiter's own note). */
  reviewedById?: string | null;
  reviewNote?: string | null;
}

export function toDetectionEventDto(
  event: DetectionEvent,
  viewerRole: InterviewParticipantRole,
): DetectionEventResponseDto {
  const dto: DetectionEventResponseDto = {
    id: event.id,
    sessionId: event.interviewSessionId,
    eventType: event.eventType,
    objectClass: event.objectClass,
    confidence: event.confidence,
    detectedAt: event.detectedAt,
    endedAt: event.endedAt,
    durationMs: event.durationMs(),
    frameCount: event.frameCount,
    metadata: event.metadata,
    reviewedAt: event.reviewedAt,
  };
  if (viewerRole === 'RECRUITER') {
    dto.reviewedById = event.reviewedById;
    dto.reviewNote = event.reviewNote;
  }
  return dto;
}
