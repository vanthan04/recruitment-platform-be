/**
 * In-memory sliding-window rate limiter, keyed by an arbitrary string (a
 * socket id). Per-process on purpose: signaling for one room only ever flows
 * through the one backend instance both sockets are connected to, and the
 * backend runs as a single long-lived container (see CLAUDE.md).
 */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Records one hit and returns whether it is within the limit. */
  tryConsume(key: string, now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  clear(key: string): void {
    this.hits.delete(key);
  }
}
