import { DetectionEvent } from '@/modules/monitoring/domain/entities/detection-event.entity';
import { MonitoringEventType } from '@/modules/monitoring/domain/services/event-rules';

export interface NewDetectionEvent {
  interviewSessionId: string;
  eventType: MonitoringEventType;
  objectClass: string;
  confidence: number;
  detectedAt: Date;
  frameCount: number;
  metadata: Record<string, unknown>;
}

export interface DetectionEventClose {
  endedAt: Date;
  confidence: number;
  frameCount: number;
  metadata: Record<string, unknown>;
}

export interface DetectionEventFilter {
  eventType?: MonitoringEventType;
  sessionId?: string;
  reviewed?: boolean;
}

export interface DetectionSummaryRow {
  interviewSessionId: string;
  eventType: MonitoringEventType;
  count: number;
  unreviewed: number;
}

export abstract class IDetectionEventRepository {
  /** Returns the new event's id. */
  abstract create(event: NewDetectionEvent): Promise<string>;
  abstract close(id: string, close: DetectionEventClose): Promise<void>;
  abstract findById(id: string): Promise<DetectionEvent | null>;
  /** Oldest first (a timeline). */
  abstract listForInterview(
    interviewId: string,
    filter: DetectionEventFilter,
    page: number,
    limit: number,
  ): Promise<{ items: DetectionEvent[]; total: number }>;
  abstract summarizeForInterview(
    interviewId: string,
  ): Promise<DetectionSummaryRow[]>;
  abstract saveReview(event: DetectionEvent): Promise<DetectionEvent>;
  /** Retention: deletes events detected before `cutoff`; returns how many. */
  abstract deleteDetectedBefore(cutoff: Date): Promise<number>;
}
