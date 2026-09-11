import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const logger = new Logger('RedisModule');

/**
 * Shared Upstash/Redis client, used for distributed rate-limit storage
 * (`ThrottlerStorageRedisService`) and account-level login-lockout tracking.
 * REDIS_URL is optional — when unset, the client is `null` and dependents
 * fall back to their non-Redis behavior (in-memory throttler storage, no
 * account lockout) so the app still boots for local dev without Redis.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          logger.warn(
            'REDIS_URL is not set — falling back to in-memory rate limiting and disabling account login-lockout tracking.',
          );
          return null;
        }

        const client = new Redis(url, {
          maxRetriesPerRequest: 2,
          // Upstash's TCP endpoint requires TLS (rediss://); ioredis infers
          // this from the URL scheme, no extra `tls` option needed.
        });
        client.on('error', (err: Error) => {
          logger.error(`Redis connection error: ${err.message}`);
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
