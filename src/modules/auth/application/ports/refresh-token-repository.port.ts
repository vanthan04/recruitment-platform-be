export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export abstract class IRefreshTokenRepositoryPort {
  abstract create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract findValidByHash(
    tokenHash: string,
  ): Promise<StoredRefreshToken | null>;
  abstract revokeByHash(userId: string, tokenHash: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
  /** Purges rows past their expiry — called by the daily cleanup cron. */
  abstract deleteExpired(before: Date): Promise<number>;
}
