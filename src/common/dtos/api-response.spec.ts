import { ApiResponse } from './api-response';

describe('ApiResponse', () => {
  it('ok() builds a success envelope, defaulting code to SUCCESS', () => {
    const envelope = ApiResponse.ok({ id: '1' }, 'Created', { total: 1 });

    expect(envelope.success).toBe(true);
    expect(envelope.message).toBe('Created');
    expect(envelope.code).toBe('SUCCESS');
    expect(envelope.data).toEqual({ id: '1' });
    expect(envelope.metadata).toEqual({ total: 1 });
    expect(envelope.timestamp).toEqual(expect.any(String));
  });

  it('ok() respects an explicit code', () => {
    const envelope = ApiResponse.ok(
      undefined,
      'No content',
      undefined,
      'NO_CONTENT',
    );
    expect(envelope.code).toBe('NO_CONTENT');
  });

  it('fail() builds an error envelope, defaulting code to ERROR', () => {
    const envelope = ApiResponse.fail('Job not found');

    expect(envelope.success).toBe(false);
    expect(envelope.message).toBe('Job not found');
    expect(envelope.code).toBe('ERROR');
    expect(envelope.data).toBeUndefined();
  });

  it('fail() respects an explicit code and carries metadata (e.g. requestId)', () => {
    const envelope = ApiResponse.fail(
      'Internal server error',
      'INTERNAL_SERVER_ERROR',
      undefined,
      {
        requestId: 'req-1',
      },
    );

    expect(envelope.code).toBe('INTERNAL_SERVER_ERROR');
    expect(envelope.metadata).toEqual({ requestId: 'req-1' });
  });
});
