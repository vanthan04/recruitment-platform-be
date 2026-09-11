import { ConfigService } from '@nestjs/config';
import { LoginAttemptRedisAdapter } from './login-attempt-redis.adapter';

function makeConfig(overrides: Record<string, number> = {}): ConfigService {
  const values: Record<string, number> = {
    LOGIN_LOCKOUT_MAX_ATTEMPTS: 3,
    LOGIN_LOCKOUT_WINDOW_SECONDS: 900,
    LOGIN_LOCKOUT_DURATION_SECONDS: 900,
    ...overrides,
  };
  return {
    get: (key: string, defaultValue?: number) => values[key] ?? defaultValue,
  } as unknown as ConfigService;
}

describe('LoginAttemptRedisAdapter', () => {
  describe('without a Redis client configured', () => {
    const adapter = new LoginAttemptRedisAdapter(null, makeConfig());

    it('never reports locked and no-ops on failure/reset', async () => {
      await expect(adapter.isLocked('user@test.com')).resolves.toBe(false);
      await expect(
        adapter.registerFailure('user@test.com'),
      ).resolves.toBeUndefined();
      await expect(
        adapter.resetOnSuccess('user@test.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('with a Redis client configured', () => {
    let redis: {
      exists: jest.Mock;
      incr: jest.Mock;
      expire: jest.Mock;
      set: jest.Mock;
      del: jest.Mock;
    };
    let adapter: LoginAttemptRedisAdapter;

    beforeEach(() => {
      redis = {
        exists: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
      };
      adapter = new LoginAttemptRedisAdapter(redis as any, makeConfig());
    });

    it('isLocked reflects the lock key existing in Redis', async () => {
      redis.exists.mockResolvedValue(1);
      await expect(adapter.isLocked('user@test.com')).resolves.toBe(true);
      expect(redis.exists).toHaveBeenCalledWith(
        'auth:login-lock:user@test.com',
      );

      redis.exists.mockResolvedValue(0);
      await expect(adapter.isLocked('user@test.com')).resolves.toBe(false);
    });

    it('sets an expiry only on the first failure', async () => {
      redis.incr.mockResolvedValue(1);
      await adapter.registerFailure('user@test.com');
      expect(redis.expire).toHaveBeenCalledWith(
        'auth:login-fail:user@test.com',
        900,
      );

      redis.expire.mockClear();
      redis.incr.mockResolvedValue(2);
      await adapter.registerFailure('user@test.com');
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it('locks the account once the failure count reaches the threshold', async () => {
      redis.incr.mockResolvedValue(3);
      await adapter.registerFailure('user@test.com');
      expect(redis.set).toHaveBeenCalledWith(
        'auth:login-lock:user@test.com',
        '1',
        'EX',
        900,
      );
    });

    it('does not lock before the threshold is reached', async () => {
      redis.incr.mockResolvedValue(2);
      await adapter.registerFailure('user@test.com');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('clears both the failure counter and lock on success', async () => {
      await adapter.resetOnSuccess('user@test.com');
      expect(redis.del).toHaveBeenCalledWith(
        'auth:login-fail:user@test.com',
        'auth:login-lock:user@test.com',
      );
    });
  });
});
