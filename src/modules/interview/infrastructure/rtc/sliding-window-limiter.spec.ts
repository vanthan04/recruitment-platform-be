import { SlidingWindowLimiter } from './sliding-window-limiter';

describe('SlidingWindowLimiter', () => {
  it('allows up to max hits in the window, then refuses', () => {
    const limiter = new SlidingWindowLimiter(3, 1000);
    expect([1, 2, 3, 4].map(() => limiter.tryConsume('a', 0))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('frees capacity as old hits leave the window', () => {
    const limiter = new SlidingWindowLimiter(2, 1000);
    limiter.tryConsume('a', 0);
    limiter.tryConsume('a', 500);
    expect(limiter.tryConsume('a', 900)).toBe(false);
    expect(limiter.tryConsume('a', 1001)).toBe(true);
  });

  it('does not count refused hits against the window', () => {
    const limiter = new SlidingWindowLimiter(1, 1000);
    limiter.tryConsume('a', 0);
    limiter.tryConsume('a', 500);
    expect(limiter.tryConsume('a', 1001)).toBe(true);
  });

  it('tracks keys independently and clears one', () => {
    const limiter = new SlidingWindowLimiter(1, 1000);
    expect(limiter.tryConsume('a', 0)).toBe(true);
    expect(limiter.tryConsume('b', 0)).toBe(true);
    expect(limiter.tryConsume('a', 1)).toBe(false);
    limiter.clear('a');
    expect(limiter.tryConsume('a', 2)).toBe(true);
  });
});
