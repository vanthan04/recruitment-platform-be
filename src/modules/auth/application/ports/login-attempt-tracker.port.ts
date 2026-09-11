/**
 * Per-identifier (login email, pre-normalized) failed-login tracking, used
 * to lock out an account after repeated wrong-password attempts —
 * independent of the IP-based `ThrottlerGuard`, which a distributed or
 * low-and-slow attacker can stay under while still brute-forcing one
 * account. Tracked by the raw email input rather than a resolved user id
 * so behavior is identical whether or not the account exists, preserving
 * the login flow's existing anti-enumeration property.
 */
export abstract class ILoginAttemptTrackerPort {
  abstract isLocked(identifier: string): Promise<boolean>;
  abstract registerFailure(identifier: string): Promise<void>;
  abstract resetOnSuccess(identifier: string): Promise<void>;
}
