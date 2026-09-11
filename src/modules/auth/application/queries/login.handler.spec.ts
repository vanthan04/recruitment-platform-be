import * as bcrypt from 'bcrypt';
import { LoginHandler } from '@/modules/auth/application/queries/login.query';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { ILoginAttemptTrackerPort } from '@/modules/auth/application/ports/login-attempt-tracker.port';
import {
  InvalidCredentialsException,
  AccountBlockedException,
  AccountLockedException,
  EmailNotVerifiedException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserStatus } from '@/common/enums/user-status.enum';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let loginAttemptTracker: jest.Mocked<ILoginAttemptTrackerPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByFacebookId: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    loginAttemptTracker = {
      isLocked: jest.fn().mockResolvedValue(false),
      registerFailure: jest.fn(),
      resetOnSuccess: jest.fn(),
    };
    handler = new LoginHandler(userRepository, loginAttemptTracker);
  });

  it('throws InvalidCredentialsException when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute({
        dto: { email: 'nouser@test.com', password: 'password123' },
      } as any),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('throws InvalidCredentialsException when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'wrong-password' },
      } as any),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('throws InvalidCredentialsException when the account has no password (social-only)', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'social@test.com',
      password: undefined,
      status: UserStatus.ACTIVE,
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'social@test.com', password: 'any-password' },
      } as any),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('returns the user when the credentials are correct', async () => {
    const storedUser = {
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
      status: UserStatus.ACTIVE,
    };
    userRepository.findByEmail.mockResolvedValue(storedUser as any);

    const result = await handler.execute({
      dto: { email: 'user@test.com', password: 'correct-password' },
    } as any);

    expect(result).toBe(storedUser);
  });

  it('throws AccountBlockedException for a blocked user', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
      status: UserStatus.BLOCKED,
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'correct-password' },
      } as any),
    ).rejects.toThrow(AccountBlockedException);
  });

  it('throws EmailNotVerifiedException for a pending user', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
      status: UserStatus.PENDING,
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'correct-password' },
      } as any),
    ).rejects.toThrow(EmailNotVerifiedException);
  });

  it('throws AccountLockedException without checking the password when the account is locked', async () => {
    loginAttemptTracker.isLocked.mockResolvedValue(true);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'correct-password' },
      } as any),
    ).rejects.toThrow(AccountLockedException);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('registers a failed attempt on wrong password', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'wrong-password' },
      } as any),
    ).rejects.toThrow(InvalidCredentialsException);

    expect(loginAttemptTracker.registerFailure).toHaveBeenCalledWith(
      'user@test.com',
    );
  });

  it('resets the failure count on successful login', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
      status: UserStatus.ACTIVE,
    } as any);

    await handler.execute({
      dto: { email: 'user@test.com', password: 'correct-password' },
    } as any);

    expect(loginAttemptTracker.resetOnSuccess).toHaveBeenCalledWith(
      'user@test.com',
    );
  });
});
