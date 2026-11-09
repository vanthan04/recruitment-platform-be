/** Mirrors the AI service contract (recruitment-platform-ai README). */
export interface FrameBoundingBox {
  /** Top-left corner, whole pixels of the submitted frame. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameDetection {
  classId: number;
  className: string;
  confidence: number;
  boundingBox: FrameBoundingBox;
}

export interface FrameDetectionResult {
  imageWidth: number;
  imageHeight: number;
  inferenceMs: number;
  detections: FrameDetection[];
}

/**
 * Every way a frame can come back. Callers map these to "show / drop this
 * frame" — none of them is fatal to the interview itself.
 */
export type DetectFrameOutcome =
  | { status: 'ok'; result: FrameDetectionResult }
  /** The AI service is at capacity: drop this frame, send the next one later. */
  | { status: 'busy' }
  /** Down, misconfigured, timed out or answered garbage. */
  | { status: 'unavailable' }
  /** The AI service refused this particular frame (format/size). */
  | { status: 'rejected' };

/** Port to the object-detection service. Observations only — no decisions. */
export abstract class IDetectionServicePort {
  /** False when AI_SERVICE_URL / AI_SERVICE_TOKEN are not configured. */
  abstract isConfigured(): boolean;
  abstract detectFrame(jpeg: Buffer): Promise<DetectFrameOutcome>;
}
