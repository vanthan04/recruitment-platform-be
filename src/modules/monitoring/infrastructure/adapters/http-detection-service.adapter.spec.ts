import { ConfigService } from '@nestjs/config';
import { HttpDetectionServiceAdapter } from './http-detection-service.adapter';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function makeAdapter(values: Record<string, unknown> = {}) {
  const config = {
    get: jest.fn((key: string, fallback?: unknown) =>
      key in values ? values[key] : fallback,
    ),
  } as unknown as ConfigService;
  return new HttpDetectionServiceAdapter(config);
}

const configured = {
  AI_SERVICE_URL: 'http://ai.internal:8000/',
  AI_SERVICE_TOKEN: 'service-token',
  AI_SERVICE_TIMEOUT_MS: 3000,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const okBody = {
  success: true,
  data: {
    imageWidth: 640,
    imageHeight: 360,
    inferenceMs: 40,
    detections: [
      {
        classId: 0,
        className: 'person',
        confidence: 0.9,
        boundingBox: { x: 10, y: 20, width: 100, height: 200 },
      },
    ],
  },
};

describe('HttpDetectionServiceAdapter', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('is unconfigured, and never calls out, without URL and token', async () => {
    const adapter = makeAdapter({ AI_SERVICE_URL: 'http://ai:8000' });

    expect(adapter.isConfigured()).toBe(false);
    await expect(adapter.detectFrame(JPEG)).resolves.toEqual({
      status: 'unavailable',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the frame as multipart with the bearer token and a timeout', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, okBody));
    const adapter = makeAdapter(configured);

    const outcome = await adapter.detectFrame(JPEG);

    expect(outcome).toEqual({ status: 'ok', result: okBody.data });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://ai.internal:8000/detect/frame');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer service-token' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const file = (init.body as FormData).get('file') as Blob;
    expect(file.type).toBe('image/jpeg');
    expect(Buffer.from(await file.arrayBuffer())).toEqual(JPEG);
  });

  it('maps 503 AI_BUSY to busy', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, {
        success: false,
        error: { code: 'AI_BUSY', message: 'x' },
      }),
    );
    await expect(makeAdapter(configured).detectFrame(JPEG)).resolves.toEqual({
      status: 'busy',
    });
  });

  it.each([400, 413, 415, 422])('maps %s to rejected', async (status) => {
    fetchMock.mockResolvedValue(
      jsonResponse(status, {
        success: false,
        error: { code: 'X', message: 'x' },
      }),
    );
    await expect(makeAdapter(configured).detectFrame(JPEG)).resolves.toEqual({
      status: 'rejected',
    });
  });

  it.each([
    [
      'model not loaded',
      503,
      { success: false, error: { code: 'MODEL_UNAVAILABLE' } },
    ],
    ['wrong token', 401, { success: false, error: { code: 'UNAUTHORIZED' } }],
    [
      'server error',
      500,
      { success: false, error: { code: 'INTERNAL_ERROR' } },
    ],
    ['a body outside the contract', 200, { success: true, data: { nope: 1 } }],
  ])('maps %s to unavailable', async (_label, status, body) => {
    fetchMock.mockResolvedValue(jsonResponse(status, body));
    await expect(makeAdapter(configured).detectFrame(JPEG)).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('maps a timeout or network failure to unavailable', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('The operation timed out'), {
        name: 'TimeoutError',
      }),
    );
    await expect(makeAdapter(configured).detectFrame(JPEG)).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('maps a non-JSON body to unavailable', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>bad gateway</html>', { status: 502 }),
    );
    await expect(makeAdapter(configured).detectFrame(JPEG)).resolves.toEqual({
      status: 'unavailable',
    });
  });
});
