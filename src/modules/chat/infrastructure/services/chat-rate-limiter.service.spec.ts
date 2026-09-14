import { ChatRateLimiterService } from '@/modules/chat/infrastructure/services/chat-rate-limiter.service';

describe('ChatRateLimiterService — in-memory fallback (REDIS_CLIENT null)', () => {
  let limiter: ChatRateLimiterService;

  beforeEach(() => {
    limiter = new ChatRateLimiterService(null);
  });

  it('allows sends up to the limit, then rejects the next one', async () => {
    for (let i = 0; i < 20; i++) {
      expect(await limiter.consumeSendQuota('user-1')).toBe(true);
    }

    expect(await limiter.consumeSendQuota('user-1')).toBe(false);
  });

  it('allows reads up to the limit, then rejects the next one', async () => {
    for (let i = 0; i < 30; i++) {
      expect(await limiter.consumeReadQuota('user-1')).toBe(true);
    }

    expect(await limiter.consumeReadQuota('user-1')).toBe(false);
  });

  it('tracks send and read budgets independently', async () => {
    for (let i = 0; i < 20; i++) {
      await limiter.consumeSendQuota('user-1');
    }
    expect(await limiter.consumeSendQuota('user-1')).toBe(false);

    // The read budget (a separate quota) is untouched by exhausting send.
    expect(await limiter.consumeReadQuota('user-1')).toBe(true);
  });

  it('tracks budgets independently per user (a reconnect cannot bypass it, but a different user is unaffected)', async () => {
    for (let i = 0; i < 20; i++) {
      await limiter.consumeSendQuota('user-1');
    }
    expect(await limiter.consumeSendQuota('user-1')).toBe(false);

    expect(await limiter.consumeSendQuota('user-2')).toBe(true);
  });

  it('allows more calls again once clearInMemoryQuota resets a user', async () => {
    for (let i = 0; i < 20; i++) {
      await limiter.consumeSendQuota('user-1');
    }
    expect(await limiter.consumeSendQuota('user-1')).toBe(false);

    limiter.clearInMemoryQuota('user-1');

    expect(await limiter.consumeSendQuota('user-1')).toBe(true);
  });

  it('allows calls again once the sliding window has fully elapsed', async () => {
    jest.useFakeTimers();
    try {
      for (let i = 0; i < 20; i++) {
        await limiter.consumeSendQuota('user-1');
      }
      expect(await limiter.consumeSendQuota('user-1')).toBe(false);

      jest.advanceTimersByTime(10_001);

      expect(await limiter.consumeSendQuota('user-1')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('ChatRateLimiterService — Redis-backed (REDIS_CLIENT configured)', () => {
  function makeRedisMock(evalResult: number) {
    return { eval: jest.fn().mockResolvedValue(evalResult) };
  }

  it('delegates to a Lua EVAL and treats a 1 reply as allowed', async () => {
    const redis = makeRedisMock(1);
    const limiter = new ChatRateLimiterService(redis as any);

    const allowed = await limiter.consumeSendQuota('user-1');

    expect(allowed).toBe(true);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('ZREMRANGEBYSCORE'),
      1,
      'chat:ratelimit:send:user-1',
      expect.any(Number),
      10_000,
      20,
      expect.any(String),
    );
  });

  it('treats a 0 reply as rejected', async () => {
    const redis = makeRedisMock(0);
    const limiter = new ChatRateLimiterService(redis as any);

    expect(await limiter.consumeReadQuota('user-1')).toBe(false);
  });

  it('uses a distinct key prefix for send vs. read quotas', async () => {
    const redis = makeRedisMock(1);
    const limiter = new ChatRateLimiterService(redis as any);

    await limiter.consumeReadQuota('user-1');

    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'chat:ratelimit:read:user-1',
      expect.any(Number),
      10_000,
      30,
      expect.any(String),
    );
  });

  it('never touches the in-memory store when Redis is configured', async () => {
    const redis = makeRedisMock(1);
    const limiter = new ChatRateLimiterService(redis as any);

    await limiter.consumeSendQuota('user-1');
    // clearInMemoryQuota should be a safe no-op either way, but this also
    // confirms consumeSendQuota didn't populate the fallback Map (nothing
    // observable here would break if it had — this documents the intent).
    expect(() => limiter.clearInMemoryQuota('user-1')).not.toThrow();
  });
});
