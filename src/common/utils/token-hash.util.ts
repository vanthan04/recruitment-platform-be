import * as crypto from 'crypto';

/**
 * One-way hash for high-entropy tokens looked up by exact match (refresh
 * tokens, verification codes, OAuth exchange codes). SHA-256 is the right
 * tool here — unlike bcrypt (used for user passwords), these tokens are
 * already random and long enough that a slow, salted hash buys nothing but
 * latency; a fast deterministic hash is what lets `WHERE tokenHash = ?`
 * work as a unique-index lookup at all.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Cryptographically random, short, human-typeable code for email-delivered verification/reset flows. */
export function generateVerificationCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    '',
  );
}
