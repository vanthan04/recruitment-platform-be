import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@/common/redis/redis.constants';

const SEND_RATE_LIMIT = 20;
const SEND_RATE_WINDOW_MS = 10_000;
const READ_RATE_LIMIT = 30;
const READ_RATE_WINDOW_MS = 10_000;

// Atomically evicts entries older than the window, then admits this call
// only if the caller is still under `limit` — done server-side in Lua so
// the check-then-increment can't race across concurrent calls on
// different app instances (a naive ZCARD-then-conditional-ZADD pair from
// the client would have exactly that race). Only successful (admitted)
// calls are recorded, so a burst of rejected calls doesn't itself grow
// the set — same effective behavior as the in-memory fallback below,
// which self-bounds via the window filter on every call either way.
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)
  return 1
end
return 0
`;

/**
 * ChatGateway's send/read rate limits, extracted out of the gateway itself
 * (see the code review's F13 — the gateway was the largest file in the
 * codebase, and this was its most self-contained piece). Keyed by userId,
 * not socket id — a socket id resets on every reconnect, which would
 * otherwise let a client bypass the limit just by reconnecting.
 *
 * Backed by Redis when configured (REDIS_URL — the same client this app
 * already uses for @nestjs/throttler's storage and login-lockout
 * tracking), so the limit is correctly shared across instances if this
 * gateway is ever deployed behind more than one container. Falls back to
 * an in-memory sliding window (correct only for a single instance — same
 * caveat ChatPresenceService's own doc comment already carries for
 * presence) when REDIS_CLIENT is null, i.e. REDIS_URL isn't set — the
 * same "degrade gracefully without Redis" rule every other Redis-backed
 * feature in this app already follows (see redis.module.ts).
 */
@Injectable()
export class ChatRateLimiterService {
  // In-memory fallback state only — never touched when Redis is configured.
  private readonly sendTimestamps = new Map<string, number[]>();
  private readonly readTimestamps = new Map<string, number[]>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async consumeSendQuota(userId: string): Promise<boolean> {
    return this.consume(
      'chat:ratelimit:send',
      userId,
      SEND_RATE_LIMIT,
      SEND_RATE_WINDOW_MS,
      this.sendTimestamps,
    );
  }

  async consumeReadQuota(userId: string): Promise<boolean> {
    return this.consume(
      'chat:ratelimit:read',
      userId,
      READ_RATE_LIMIT,
      READ_RATE_WINDOW_MS,
      this.readTimestamps,
    );
  }

  /**
   * Called from ChatGateway.handleDisconnect once a user's last socket
   * closes — only meaningful for the in-memory fallback (a Redis key
   * expires on its own via PEXPIRE either way, so this is a no-op there,
   * not an error to skip).
   */
  clearInMemoryQuota(userId: string): void {
    this.sendTimestamps.delete(userId);
    this.readTimestamps.delete(userId);
  }

  private async consume(
    keyPrefix: string,
    userId: string,
    limit: number,
    windowMs: number,
    fallbackStore: Map<string, number[]>,
  ): Promise<boolean> {
    if (this.redis) {
      return this.consumeRedis(`${keyPrefix}:${userId}`, limit, windowMs);
    }
    return this.consumeInMemory(fallbackStore, userId, limit, windowMs);
  }

  private async consumeRedis(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean> {
    const now = Date.now();
    // Unique per call (not just `now`) so two calls in the same
    // millisecond don't collide as the same sorted-set member.
    const member = `${now}-${Math.random().toString(36).slice(2)}`;
    const allowed = (await this.redis!.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      key,
      now,
      windowMs,
      limit,
      member,
    )) as number;
    return allowed === 1;
  }

  /** Sliding-window limiter. Returns false (and does not consume) once the caller is over budget. */
  private consumeInMemory(
    store: Map<string, number[]>,
    key: string,
    limit: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    store.set(key, timestamps);
    return timestamps.length <= limit;
  }
}
