import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisClient } from './redis.module';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('createRedisClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null and logs a plain warning when REDIS_URL is unset outside production', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const client = createRedisClient(makeConfig({ NODE_ENV: 'development' }));

    expect(client).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('REDIS_URL is not set'),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('returns null and logs at error severity when REDIS_URL is unset in production', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // A missing REDIS_URL in production silently disables account
    // login-lockout tracking — this must be loud, not a routine dev warning.
    const client = createRedisClient(makeConfig({ NODE_ENV: 'production' }));

    expect(client).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('REDIS_URL is not set'),
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('constructs a real client when REDIS_URL is set', () => {
    const client = createRedisClient(
      makeConfig({
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
      }),
    );

    expect(client).not.toBeNull();
    client?.disconnect();
  });
});
