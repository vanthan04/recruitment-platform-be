import { AuthService } from './auth.service';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { IOauthLoginCodeRepositoryPort } from '@/modules/auth/application/ports/oauth-login-code-repository.port';
import {
  InvalidOrExpiredExchangeCodeException,
  RefreshTokenAccessDeniedException,
  AccountBlockedException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

// Only exchangeSocialCode is covered here — the rest of AuthService is a
// thin CommandBus/QueryBus facade already exercised indirectly through each
// command/query's own spec file.
describe('AuthService.exchangeSocialCode', () => {
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepositoryPort>;
  let oauthLoginCodeRepository: jest.Mocked<IOauthLoginCodeRepositoryPort>;
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByFacebookId: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    refreshTokenRepository = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      revokeByHash: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    oauthLoginCodeRepository = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      markUsed: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    configService = { get: jest.fn() };

    service = new AuthService(
      userRepository,
      refreshTokenRepository,
      oauthLoginCodeRepository,
      jwtService as any,
      configService as any,
      {} as any,
      {} as any,
    );
  });

  it('throws InvalidOrExpiredExchangeCodeException for an unknown/expired/used code', async () => {
    oauthLoginCodeRepository.findValidByHash.mockResolvedValue(null);

    await expect(service.exchangeSocialCode('bad-code')).rejects.toThrow(
      InvalidOrExpiredExchangeCodeException,
    );
    expect(oauthLoginCodeRepository.markUsed).not.toHaveBeenCalled();
  });

  it('marks the code used and mints a token pair for a valid code', async () => {
    oauthLoginCodeRepository.findValidByHash.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
    });
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
      status: UserStatus.ACTIVE,
    });

    const result = await service.exchangeSocialCode('good-code');

    expect(oauthLoginCodeRepository.markUsed).toHaveBeenCalledWith('code-1');
    expect(result).toEqual({
      access_token: 'signed-jwt',
      refresh_token: 'signed-jwt',
    });
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      expect.any(Date),
    );
  });

  it('throws AccountBlockedException when the linked user has been blocked', async () => {
    oauthLoginCodeRepository.findValidByHash.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
    });
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
      status: UserStatus.BLOCKED,
    });

    await expect(service.exchangeSocialCode('good-code')).rejects.toThrow(
      AccountBlockedException,
    );
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('throws if the code is valid but the user it points to no longer exists', async () => {
    oauthLoginCodeRepository.findValidByHash.mockResolvedValue({
      id: 'code-1',
      userId: 'deleted-user',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
    });
    userRepository.findById.mockResolvedValue(null);

    await expect(service.exchangeSocialCode('good-code')).rejects.toThrow(
      InvalidOrExpiredExchangeCodeException,
    );
  });
});

describe('AuthService.refreshTokens', () => {
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepositoryPort>;
  let oauthLoginCodeRepository: jest.Mocked<IOauthLoginCodeRepositoryPort>;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let service: AuthService;

  const validStoredToken = {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: expect.any(String),
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: null,
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByFacebookId: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    refreshTokenRepository = {
      create: jest.fn(),
      findValidByHash: jest.fn().mockResolvedValue({ ...validStoredToken }),
      revokeByHash: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    oauthLoginCodeRepository = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      markUsed: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
    };
    configService = { get: jest.fn() };

    service = new AuthService(
      userRepository,
      refreshTokenRepository,
      oauthLoginCodeRepository,
      jwtService as any,
      configService as any,
      {} as any,
      {} as any,
    );
  });

  it('rotates and returns a new token pair for an active user', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
      status: UserStatus.ACTIVE,
    });

    const result = await service.refreshTokens('old-refresh-token');

    expect(refreshTokenRepository.revokeByHash).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
    expect(result).toEqual({
      access_token: 'signed-jwt',
      refresh_token: 'signed-jwt',
    });
  });

  it('throws AccountBlockedException instead of rotating tokens for a blocked user', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
      status: UserStatus.BLOCKED,
    });

    await expect(service.refreshTokens('old-refresh-token')).rejects.toThrow(
      AccountBlockedException,
    );
    expect(refreshTokenRepository.revokeByHash).not.toHaveBeenCalled();
  });

  it('throws RefreshTokenAccessDeniedException when the token is valid but the user no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(service.refreshTokens('old-refresh-token')).rejects.toThrow(
      RefreshTokenAccessDeniedException,
    );
  });
});
