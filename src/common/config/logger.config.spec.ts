import { redactSecretsDeep } from '@/common/config/logger.config';

describe('redactSecretsDeep', () => {
  it('redacts a top-level key matching the secret pattern', () => {
    expect(redactSecretsDeep({ accessToken: 'xyz', email: 'a@b.com' })).toEqual(
      { accessToken: '**redacted**', email: 'a@b.com' },
    );
  });

  it('redacts a secret-like key nested at any depth, not just an enumerated path', () => {
    const result = redactSecretsDeep({
      payload: { nested: { deeper: { clientSecret: 'abc' } } },
    });

    expect(result).toEqual({
      payload: { nested: { deeper: { clientSecret: '**redacted**' } } },
    });
  });

  it('redacts secret-like keys inside array elements', () => {
    const result = redactSecretsDeep({
      items: [{ apiKey: 'a' }, { email: 'b@c.com' }],
    });

    expect(result).toEqual({
      items: [{ apiKey: '**redacted**' }, { email: 'b@c.com' }],
    });
  });

  it('is case-insensitive on the key name', () => {
    expect(redactSecretsDeep({ AccessToken: 'x', PASSWORD: 'y' })).toEqual({
      AccessToken: '**redacted**',
      PASSWORD: '**redacted**',
    });
  });

  it('leaves req/res/err untouched at the top level, so pino can still apply its own serializers to them', () => {
    const err = new Error('boom');
    const result = redactSecretsDeep({
      err,
      req: { headers: { authorization: 'Bearer x' } },
      res: { statusCode: 200 },
    }) as Record<string, unknown>;

    expect(result.err).toBe(err);
    expect(result.req).toEqual({ headers: { authorization: 'Bearer x' } });
    expect(result.res).toEqual({ statusCode: 200 });
  });

  it('does not crash on a circular reference, stopping at the depth limit instead', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    expect(() => redactSecretsDeep(circular)).not.toThrow();
  });

  it('leaves primitives and Date instances unchanged', () => {
    const date = new Date('2026-01-01');
    expect(redactSecretsDeep('plain string')).toBe('plain string');
    expect(redactSecretsDeep(42)).toBe(42);
    expect(redactSecretsDeep(null)).toBeNull();
    expect(redactSecretsDeep(date)).toBe(date);
  });
});
