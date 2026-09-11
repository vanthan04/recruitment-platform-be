import { resolveCorsOptions } from './cors.config';

describe('resolveCorsOptions', () => {
  it('reflects any origin when CORS_ORIGIN is unset', () => {
    expect(resolveCorsOptions(undefined)).toEqual({
      origin: true,
      credentials: true,
    });
  });

  it('splits a comma-separated allowlist into a trimmed array', () => {
    expect(
      resolveCorsOptions('https://app.example.com, https://admin.example.com'),
    ).toEqual({
      origin: ['https://app.example.com', 'https://admin.example.com'],
      credentials: true,
    });
  });

  it('wraps a single origin in an array', () => {
    expect(resolveCorsOptions('https://app.example.com')).toEqual({
      origin: ['https://app.example.com'],
      credentials: true,
    });
  });
});
