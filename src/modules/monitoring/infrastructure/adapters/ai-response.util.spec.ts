import {
  MAX_DETECTIONS_PER_FRAME,
  parseDetectionResponse,
} from './ai-response.util';

const detection = (overrides: Record<string, unknown> = {}) => ({
  classId: 67,
  className: 'cell phone',
  confidence: 0.81,
  boundingBox: { x: 200, y: 50, width: 60, height: 100 },
  ...overrides,
});

const body = (data: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    imageWidth: 640,
    imageHeight: 360,
    inferenceMs: 41.7,
    detections: [detection()],
    ...data,
  },
});

describe('parseDetectionResponse', () => {
  it('accepts the contract and keeps only whitelisted fields', () => {
    const parsed = parseDetectionResponse({
      ...body({ detections: [detection({ extra: 'x' })], debug: 'y' }),
      other: 1,
    });
    expect(parsed).toEqual({
      imageWidth: 640,
      imageHeight: 360,
      inferenceMs: 41.7,
      detections: [detection()],
    });
  });

  it('accepts an empty detection list', () => {
    expect(
      parseDetectionResponse(body({ detections: [] }))?.detections,
    ).toEqual([]);
  });

  it.each([
    ['not an object', 'nope'],
    ['an error envelope', { success: false, error: { code: 'X' } }],
    ['missing data', { success: true }],
    ['a fractional width', body({ imageWidth: 640.5 })],
    ['a non-finite inferenceMs', body({ inferenceMs: Infinity })],
    ['detections not an array', body({ detections: {} })],
    [
      'a confidence above 1',
      body({ detections: [detection({ confidence: 1.2 })] }),
    ],
    [
      'a negative box',
      body({
        detections: [
          detection({ boundingBox: { x: -1, y: 0, width: 1, height: 1 } }),
        ],
      }),
    ],
    [
      'a box outside the image',
      body({
        detections: [
          detection({ boundingBox: { x: 600, y: 0, width: 60, height: 10 } }),
        ],
      }),
    ],
    [
      'an empty class name',
      body({ detections: [detection({ className: '' })] }),
    ],
    [
      'a missing box',
      body({ detections: [detection({ boundingBox: undefined })] }),
    ],
  ])('rejects %s', (_label, input) => {
    expect(parseDetectionResponse(input)).toBeNull();
  });

  it('rejects an implausible number of detections', () => {
    const many = Array.from({ length: MAX_DETECTIONS_PER_FRAME + 1 }, () =>
      detection(),
    );
    expect(parseDetectionResponse(body({ detections: many }))).toBeNull();
  });
});
