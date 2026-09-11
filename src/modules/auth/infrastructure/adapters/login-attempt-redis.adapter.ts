import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@/common/redis/redis.constants';
import { ILoginAttemptTrackerPort } from '@/modules/auth/application/ports/login-attempt-tracker.port';

const FAIL_KEY_PREFIX = 'auth:login-fail:';
const LOCK_KEY_PREFIX = 'auth:login-lock:';

/**
 * No Redis configured (`REDIS_URL` unset) → every call is a no-op and
 * `isLocked` always resolves `false`, so login works exactly as before
 * rather than failing to boot or silently blocking everyone.
 */
@Injectable()
export class LoginAttemptRedisAdapter implements ILoginAttemptTrackerPort {
  private readonly maxAttempts: number;
  private readonly windowSeconds: number;
  private readonly lockoutSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    configService: ConfigService,
  ) {
    this.maxAttempts = configService.get<number>(
      'LOGIN_LOCKOUT_MAX_ATTEMPTS',
      10,
    );
    this.windowSeconds = configService.get<number>(
      'LOGIN_LOCKOUT_WINDOW_SECONDS',
      900,
    );
    this.lockoutSeconds = configService.get<number>(
      'LOGIN_LOCKOUT_DURATION_SECONDS',
      900,
    );
  }

  async isLocked(identifier: string): Promise<boolean> {
    if (!this.redis) return false;
    const locked = await this.redis.exists(this.lockKey(identifier));
    return locked === 1;
  }

  async registerFailure(identifier: string): Promise<void> {
    if (!this.redis) return;
    const key = this.failKey(identifier);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }
    if (count >= this.maxAttempts) {
      await this.redis.set(
        this.lockKey(identifier),
        '1',
        'EX',
        this.lockoutSeconds,
      );
    }
  }

  async resetOnSuccess(identifier: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(this.failKey(identifier), this.lockKey(identifier));
  }

  private failKey(identifier: string): string {
    return `${FAIL_KEY_PREFIX}${identifier}`;
  }

  private lockKey(identifier: string): string {
    return `${LOCK_KEY_PREFIX}${identifier}`;
  }
}
