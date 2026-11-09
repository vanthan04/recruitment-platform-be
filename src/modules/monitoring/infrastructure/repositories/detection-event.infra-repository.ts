import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DetectionEventClose,
  DetectionEventFilter,
  DetectionSummaryRow,
  IDetectionEventRepository,
  NewDetectionEvent,
} from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { DetectionEvent } from '@/modules/monitoring/domain/entities/detection-event.entity';
import {
  DetectionEventPrismaRepository,
  DetectionEventRaw,
} from '@/modules/monitoring/infrastructure/persistence/prisma/detection-event-prisma.repository';
import { normalizePagination } from '@/common/utils/pagination.util';

function toDomain(raw: DetectionEventRaw): DetectionEvent {
  return new DetectionEvent({
    id: raw.id,
    interviewSessionId: raw.interviewSessionId,
    interviewId: raw.session.interviewId,
    eventType: raw.eventType,
    objectClass: raw.objectClass,
    confidence: raw.confidence,
    detectedAt: raw.detectedAt,
    endedAt: raw.endedAt,
    frameCount: raw.frameCount,
    metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
    reviewedAt: raw.reviewedAt,
    reviewedById: raw.reviewedById,
    reviewNote: raw.reviewNote,
  });
}

@Injectable()
export class DetectionEventInfraRepository implements IDetectionEventRepository {
  constructor(private readonly prisma: DetectionEventPrismaRepository) {}

  create(event: NewDetectionEvent): Promise<string> {
    return this.prisma.create({
      ...event,
      metadata: event.metadata as Prisma.InputJsonValue,
    });
  }

  async close(id: string, close: DetectionEventClose): Promise<void> {
    await this.prisma.update(id, {
      ...close,
      metadata: close.metadata as Prisma.InputJsonValue,
    });
  }

  async findById(id: string): Promise<DetectionEvent | null> {
    const raw = await this.prisma.findById(id);
    return raw ? toDomain(raw) : null;
  }

  async listForInterview(
    interviewId: string,
    filter: DetectionEventFilter,
    page: number,
    limit: number,
  ): Promise<{ items: DetectionEvent[]; total: number }> {
    const { skip } = normalizePagination({ page, limit });
    const where: Prisma.InterviewDetectionEventWhereInput = {
      session: { interviewId },
      ...(filter.eventType && { eventType: filter.eventType }),
      ...(filter.sessionId && { interviewSessionId: filter.sessionId }),
      ...(filter.reviewed !== undefined && {
        reviewedAt: filter.reviewed ? { not: null } : null,
      }),
    };
    const { items, total } = await this.prisma.list(where, skip, limit);
    return { items: items.map(toDomain), total };
  }

  async summarizeForInterview(
    interviewId: string,
  ): Promise<DetectionSummaryRow[]> {
    const { all, unreviewed } = await this.prisma.groupCounts(interviewId);
    const key = (s: string, t: string) => `${s}|${t}`;
    const unreviewedBy = new Map(
      unreviewed.map((r) => [
        key(r.interviewSessionId, r.eventType),
        (r._count as { _all: number })._all,
      ]),
    );
    return all.map((r) => ({
      interviewSessionId: r.interviewSessionId,
      eventType: r.eventType,
      count: (r._count as { _all: number })._all,
      unreviewed: unreviewedBy.get(key(r.interviewSessionId, r.eventType)) ?? 0,
    }));
  }

  async saveReview(event: DetectionEvent): Promise<DetectionEvent> {
    const raw = await this.prisma.update(event.id, {
      reviewedAt: event.reviewedAt,
      reviewedById: event.reviewedById,
      reviewNote: event.reviewNote,
    });
    return toDomain(raw);
  }

  deleteDetectedBefore(cutoff: Date): Promise<number> {
    return this.prisma.deleteDetectedBefore(cutoff);
  }
}
