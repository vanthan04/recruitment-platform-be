import {
  ForgotPasswordCommand,
  ForgotPasswordHandler,
} from '@/modules/auth/application/commands/forgot-password.command';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';

describe('ForgotPasswordHandler', () => {
  let handler: ForgotPasswordHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let mailService: jest.Mocked<IAuthMailServicePort>;
  let verificationTokenRepository: jest.Mocked<IVerificationTokenRepositoryPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    mailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    verificationTokenRepository = {
      create: jest.fn(),
      findValidByHashAndType: jest.fn(),
      markUsed: jest.fn(),
      deleteExpiredOrUsed: jest.fn(),
    };
    handler = new ForgotPasswordHandler(
      userRepository,
      mailService,
      verificationTokenRepository,
    );
  });

  it('creates a reset token and emails the user when the account exists', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
    } as any);

    const result = await handler.execute(
      new ForgotPasswordCommand({ email: 'user@test.com' } as any),
    );

    expect(verificationTokenRepository.create).toHaveBeenCalledWith(
      'user-1',
      'PASSWORD_RESET',
      expect.any(String),
      expect.any(Date),
    );
    expect(mailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com' }),
    );
    expect(result.message).toMatch(/if an account with that email exists/i);
  });

  it('returns the identical response for a non-existent email — no account enumeration', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const result = await handler.execute(
      new ForgotPasswordCommand({ email: 'nobody@test.com' } as any),
    );

    expect(verificationTokenRepository.create).not.toHaveBeenCalled();
    expect(mailService.sendEmail).not.toHaveBeenCalled();
    expect(result.message).toMatch(/if an account with that email exists/i);
  });

  it('still returns the success response when the recovery email fails to send (and does not leak that failure as a 500)', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
    } as any);
    mailService.sendEmail.mockRejectedValue(new Error('SMTP timeout'));

    const result = await handler.execute(
      new ForgotPasswordCommand({ email: 'user@test.com' } as any),
    );

    expect(result.message).toMatch(/if an account with that email exists/i);
  });
});
