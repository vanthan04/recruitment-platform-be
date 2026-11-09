import {
  FrameDetection,
  FrameDetectionResult,
} from '@/modules/monitoring/application/ports/detection-service.port';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v);

const isNonNegInt = (v: unknown): v is number => isInt(v) && v >= 0;

/** Upper bound on what one frame can claim, so a faulty service can't flood the browser. */
export const MAX_DETECTIONS_PER_FRAME = 100;

/**
 * Validates the AI service's success body at the boundary and rebuilds it from
 * whitelisted fields. Returns null for anything that doesn't match the
 * contract — the caller treats that as "service unavailable", never passes it on.
 */
export function parseDetectionResponse(
  body: unknown,
): FrameDetectionResult | null {
  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
    return null;
  }
  const { imageWidth, imageHeight, inferenceMs, detections } = body.data;
  if (
    !isNonNegInt(imageWidth) ||
    !isNonNegInt(imageHeight) ||
    typeof inferenceMs !== 'number' ||
    !Number.isFinite(inferenceMs) ||
    !Array.isArray(detections) ||
    detections.length > MAX_DETECTIONS_PER_FRAME
  ) {
    return null;
  }

  const parsed: FrameDetection[] = [];
  for (const d of detections) {
    if (!isRecord(d) || !isRecord(d.boundingBox)) return null;
    const { classId, className, confidence } = d;
    const { x, y, width, height } = d.boundingBox;
    if (
      !isNonNegInt(classId) ||
      typeof className !== 'string' ||
      className.length === 0 ||
      className.length > 64 ||
      typeof confidence !== 'number' ||
      !(confidence >= 0 && confidence <= 1) ||
      !isNonNegInt(x) ||
      !isNonNegInt(y) ||
      !isNonNegInt(width) ||
      !isNonNegInt(height) ||
      x + width > imageWidth ||
      y + height > imageHeight
    ) {
      return null;
    }
    parsed.push({
      classId,
      className,
      confidence,
      boundingBox: { x, y, width, height },
    });
  }

  return { imageWidth, imageHeight, inferenceMs, detections: parsed };
}
