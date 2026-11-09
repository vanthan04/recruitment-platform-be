import { MonitoringEventType } from '@/modules/monitoring/domain/services/event-rules';

export type DetectionEventProps = Omit<DetectionEvent, 'review' | 'durationMs'>;

/** A persisted monitoring event (see event-rules.ts for how they begin and end). */
export class DetectionEvent {
  id: string;
  interviewSessionId: string;
  /** Via the session — used for authorization. */
  interviewId: string;
  eventType: MonitoringEventType;
  objectClass: string;
  confidence: number;
  detectedAt: Date;
  endedAt: Date | null;
  frameCount: number;
  metadata: Record<string, unknown> | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
  reviewNote: string | null;

  constructor(props: DetectionEventProps) {
    Object.assign(this, props);
  }

  /** A recruiter's acknowledgement. Re-reviewing replaces the note and time. */
  review(reviewerId: string, note: string | null, at: Date = new Date()): void {
    this.reviewedAt = at;
    this.reviewedById = reviewerId;
    this.reviewNote = note;
  }

  durationMs(): number | null {
    return this.endedAt
      ? this.endedAt.getTime() - this.detectedAt.getTime()
      : null;
  }
}
