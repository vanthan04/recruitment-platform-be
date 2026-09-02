import { ConflictException } from '@nestjs/common';
import { RegisterHandler } from '@/modules/auth/application/commands/register.command';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { UserRole } from '@/common/enums/user-role.enum';

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let mailService: jest.Mocked<IAuthMailServicePort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      findByVerifyCode: jest.fn(),
    };
    mailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    handler = new RegisterHandler(userRepository, mailService);
  });

  it('throws ConflictException when the email is already registered', async () => {
    userRepository.existsByEmail.mockResolvedValue(true);

    await expect(
      handler.execute({
        dto: {
          email: 'taken@test.com',
          password: 'password123',
          fullName: 'Taken User',
          role: UserRole.CANDIDATE,
        },
      } as any),
    ).rejects.toThrow(ConflictException);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(mailService.sendEmail).not.toHaveBeenCalled();
  });

  it('creates the user with a hashed password and sends a verification email', async () => {
    userRepository.existsByEmail.mockResolvedValue(false);
    userRepository.save.mockResolvedValue({
      id: 'user-1',
      email: 'new@test.com',
    } as any);

    const result = await handler.execute({
      dto: {
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User',
        role: UserRole.CANDIDATE,
      },
    } as any);

    expect(result).toEqual({ email: 'new@test.com' });

    const saveArgs = userRepository.save.mock.calls[0][0];
    expect(saveArgs.email).toBe('new@test.com');
    expect(saveArgs.password).not.toBe('password123'); // must be hashed
    expect(saveArgs.verifyCode).toEqual(expect.any(String));

    expect(mailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'new@test.com' }),
    );
  });
});
