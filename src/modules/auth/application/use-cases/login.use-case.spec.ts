import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      findByVerifyCode: jest.fn(),
    };
    useCase = new LoginUseCase(userRepository);
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'nouser@test.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    } as any);

    await expect(
      useCase.execute({ email: 'user@test.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the user when the credentials are correct', async () => {
    const storedUser = {
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    };
    userRepository.findByEmail.mockResolvedValue(storedUser as any);

    const result = await useCase.execute({
      email: 'user@test.com',
      password: 'correct-password',
    });

    expect(result).toBe(storedUser);
  });
});
