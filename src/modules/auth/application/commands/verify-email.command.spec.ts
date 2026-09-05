import {
  VerifyEmailCommand,
  VerifyEmailHandler,
} from '@/modules/auth/application/commands/verify-email.command';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

describe('VerifyEmailHandler', () => {
  let handler: VerifyEmailHandler;
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
    handler = new VerifyEmailHandler(
      userRepository,
      verificationTokenRepository,
    );
  });

  it('throws InvalidVerificationCodeException when the code has no matching valid token', async () => {
    verificationTokenRepository.findValidByHashAndType.mockResolvedValue(null);

    await expect(
      handler.execute(new VerifyEmailCommand({ code: 'WRONGCODE' })),
    ).rejects.toThrow(InvalidVerificationCodeException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('activates the user and marks the token used on a valid code', async () => {
    verificationTokenRepository.findValidByHashAndType.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      type: 'EMAIL_VERIFICATION' as any,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      usedAt: null,
    });
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
      status: UserStatus.PENDING,
    } as any);
    userRepository.save.mockImplementation(async (u) => u as any);

    const result = await handler.execute(
      new VerifyEmailCommand({ code: 'RIGHTCODE' }),
    );

    expect(verificationTokenRepository.markUsed).toHaveBeenCalledWith(
      'token-1',
    );
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: UserStatus.ACTIVE }),
    );
    expect(result.message).toEqual(expect.any(String));
  });
});
