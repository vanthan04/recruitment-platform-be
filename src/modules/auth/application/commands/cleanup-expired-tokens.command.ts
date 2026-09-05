import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';

/**
 * Dispatched by the daily cron trigger (`cleanup-expired-tokens.cron.ts`).
 * Purges rows that can never be used again — expired/revoked refresh
 * tokens and expired/used verification tokens — so these tables don't grow
 * unbounded.
 */
export class CleanupExpiredTokensCommand {}

@Injectable()
@CommandHandler(CleanupExpiredTokensCommand)
export class CleanupExpiredTokensHandler implements ICommandHandler<
  CleanupExpiredTokensCommand,
  void
> {
  private readonly logger = new Logger(CleanupExpiredTokensHandler.name);

  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepositoryPort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute(): Promise<void> {
    const now = new Date();
    const [refreshTokensDeleted, verificationTokensDeleted] = await Promise.all(
      [
        this.refreshTokenRepository.deleteExpired(now),
        this.verificationTokenRepository.deleteExpiredOrUsed(now),
      ],
    );

    if (refreshTokensDeleted > 0 || verificationTokensDeleted > 0) {
      this.logger.log(
        `Cleaned up ${refreshTokensDeleted} expired refresh token(s) and ${verificationTokensDeleted} expired/used verification token(s)`,
      );
    }
  }
}
