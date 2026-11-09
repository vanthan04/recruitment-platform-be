import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import {
  InterviewSession as PrismaInterviewSession,
  Prisma,
} from '@prisma/client';

export class InterviewSessionMapper {
  static toDomain(raw: PrismaInterviewSession | null): InterviewSession | null {
    if (!raw) return null;
    return new InterviewSession({
      id: raw.id,
      interviewId: raw.interviewId,
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      startedById: raw.startedById,
      monitoringConsentAt: raw.monitoringConsentAt,
      monitoringNoticeVersion: raw.monitoringNoticeVersion,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(
    session: InterviewSession,
  ): Prisma.InterviewSessionUncheckedCreateInput {
    return {
      id: session.id,
      interviewId: session.interviewId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      startedById: session.startedById,
      monitoringConsentAt: session.monitoringConsentAt,
      monitoringNoticeVersion: session.monitoringNoticeVersion,
    };
  }
}
