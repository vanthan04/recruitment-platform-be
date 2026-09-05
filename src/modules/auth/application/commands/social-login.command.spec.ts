import { SocialLoginHandler, SocialLoginCommand } from './social-login.command';
import {
  IAuthUserRepositoryPort,
  AuthUserRecord,
} from '@/modules/auth/application/ports/auth-user-repository.port';
import { IOauthLoginCodeRepositoryPort } from '@/modules/auth/application/ports/oauth-login-code-repository.port';
import { SocialProfile } from '@/common/strategies/google.strategy';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

function makeProfile(overrides: Partial<SocialProfile> = {}): SocialProfile {
  return {
    provider: 'GOOGLE',
    providerId: 'google-123',
    email: 'candidate@example.com',
    fullName: 'Candidate Name',
    ...overrides,
  };
}

function makeUser(overrides: Partial<AuthUserRecord> = {}): AuthUserRecord {
  return {
    id: 'user-1',
    email: 'candidate@example.com',
    role: UserRole.CANDIDATE,
    status: UserStatus.ACTIVE,
    ...overrides,
  };
}

describe('SocialLoginHandler', () => {
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let oauthLoginCodeRepository: jest.Mocked<IOauthLoginCodeRepositoryPort>;
  let handler: SocialLoginHandler;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByFacebookId: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    oauthLoginCodeRepository = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      markUsed: jest.fn(),
    };
    handler = new SocialLoginHandler(userRepository, oauthLoginCodeRepository);
  });

  it('returns a code for an existing user matched by providerId, without creating or linking', async () => {
    userRepository.findByGoogleId.mockResolvedValue(makeUser());

    const result = await handler.execute(new SocialLoginCommand(makeProfile()));

    expect(result.code).toEqual(expect.any(String));
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(oauthLoginCodeRepository.create).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      expect.any(Date),
    );
  });

  it('links the provider to an existing account found by email, when no providerId match exists', async () => {
    userRepository.findByGoogleId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(makeUser());
    userRepository.save.mockResolvedValue(makeUser());

    await handler.execute(new SocialLoginCommand(makeProfile()));

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', googleId: 'google-123' }),
    );
  });

  it('creates a new CANDIDATE account when no user matches by providerId or email', async () => {
    userRepository.findByGoogleId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(makeUser());

    await handler.execute(new SocialLoginCommand(makeProfile()));

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
        googleId: 'google-123',
      }),
    );
  });

  it('honors an explicit RECRUITER requested role for a new account', async () => {
    userRepository.findByGoogleId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(
      makeUser({ role: UserRole.RECRUITER }),
    );

    await handler.execute(
      new SocialLoginCommand(makeProfile(), UserRole.RECRUITER),
    );

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.RECRUITER }),
    );
  });

  it('silently drops a spoofed ADMIN requested role to CANDIDATE for a new account', async () => {
    userRepository.findByGoogleId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(makeUser());

    await handler.execute(new SocialLoginCommand(makeProfile(), 'ADMIN'));

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.CANDIDATE }),
    );
  });

  it('looks up by facebookId for a FACEBOOK profile', async () => {
    userRepository.findByFacebookId.mockResolvedValue(makeUser());

    await handler.execute(
      new SocialLoginCommand(
        makeProfile({ provider: 'FACEBOOK', providerId: 'fb-456' }),
      ),
    );

    expect(userRepository.findByFacebookId).toHaveBeenCalledWith('fb-456');
    expect(userRepository.findByGoogleId).not.toHaveBeenCalled();
  });
});
