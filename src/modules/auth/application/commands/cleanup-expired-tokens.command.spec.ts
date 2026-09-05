import {
  CleanupExpiredTokensHandler,
  CleanupExpiredTokensCommand,
} from './cleanup-expired-tokens.command';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';

describe('CleanupExpiredTokensHandler', () => {
  it('purges expired refresh tokens and expired/used verification tokens', async () => {
    const refreshTokenRepository: jest.Mocked<IRefreshTokenRepositoryPort> = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      revokeByHash: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn().mockResolvedValue(3),
    };
    const verificationTokenRepository: jest.Mocked<IVerificationTokenRepositoryPort> =
      {
        create: jest.fn(),
        findValidByHashAndType: jest.fn(),
        markUsed: jest.fn(),
        deleteExpiredOrUsed: jest.fn().mockResolvedValue(2),
      };

    const handler = new CleanupExpiredTokensHandler(
      refreshTokenRepository,
      verificationTokenRepository,
    );

    await handler.execute(new CleanupExpiredTokensCommand());

    expect(refreshTokenRepository.deleteExpired).toHaveBeenCalledWith(
      expect.any(Date),
    );
    expect(
      verificationTokenRepository.deleteExpiredOrUsed,
    ).toHaveBeenCalledWith(expect.any(Date));
  });
});
