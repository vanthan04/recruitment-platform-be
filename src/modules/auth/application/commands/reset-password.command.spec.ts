import * as bcrypt from 'bcrypt';
import {
  ResetPasswordCommand,
  ResetPasswordHandler,
} from '@/modules/auth/application/commands/reset-password.command';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

describe('ResetPasswordHandler', () => {
  let handler: ResetPasswordHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let verificationTokenRepository: jest.Mocked<IVerificationTokenRepositoryPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    verificationTokenRepository = {
      create: jest.fn(),
      findValidByHashAndType: jest.fn(),
      markUsed: jest.fn(),
    };
    handler = new ResetPasswordHandler(
      userRepository,
      verificationTokenRepository,
    );
  });

  it('throws InvalidVerificationCodeException for an expired/reused/wrong-type token', async () => {
    verificationTokenRepository.findValidByHashAndType.mockResolvedValue(null);

    await expect(
      handler.execute(
        new ResetPasswordCommand({ code: 'STALE', newPassword: 'newpass123' }),
      ),
    ).rejects.toThrow(InvalidVerificationCodeException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('a verification-code cannot be replayed as a password-reset code', async () => {
    // The repository itself enforces the type match (PASSWORD_RESET only);
    // this asserts the handler passes PASSWORD_RESET, not a shared/loose type.
    verificationTokenRepository.findValidByHashAndType.mockResolvedValue(null);

    await expect(
      handler.execute(
        new ResetPasswordCommand({
          code: 'EMAILCODE',
          newPassword: 'newpass123',
        }),
      ),
    ).rejects.toThrow(InvalidVerificationCodeException);
    expect(
      verificationTokenRepository.findValidByHashAndType,
    ).toHaveBeenCalledWith(expect.any(String), 'PASSWORD_RESET');
  });

  it('updates the hashed password and marks the token used on a valid code', async () => {
    verificationTokenRepository.findValidByHashAndType.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      type: 'PASSWORD_RESET' as any,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      usedAt: null,
    });
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      password: 'old-hash',
      role: UserRole.CANDIDATE,
      status: UserStatus.ACTIVE,
    } as any);
    userRepository.save.mockImplementation(async (u) => u as any);

    await handler.execute(
      new ResetPasswordCommand({
        code: 'RIGHTCODE',
        newPassword: 'newpass123',
      }),
    );

    expect(verificationTokenRepository.markUsed).toHaveBeenCalledWith(
      'token-1',
    );
    const saveArgs = userRepository.save.mock.calls[0][0] as any;
    expect(saveArgs.password).not.toBe('newpass123');
    expect(saveArgs.password).not.toBe('old-hash');
    expect(await bcrypt.compare('newpass123', saveArgs.password)).toBe(true);
  });
});
