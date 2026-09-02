import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginHandler } from '@/modules/auth/application/queries/login.query';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      findByVerifyCode: jest.fn(),
    };
    handler = new LoginHandler(userRepository);
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute({
        dto: { email: 'nouser@test.com', password: 'password123' },
      } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    } as any);

    await expect(
      handler.execute({
        dto: { email: 'user@test.com', password: 'wrong-password' },
      } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the user when the credentials are correct', async () => {
    const storedUser = {
      id: 'user-1',
      email: 'user@test.com',
      password: await bcrypt.hash('correct-password', 4),
    };
    userRepository.findByEmail.mockResolvedValue(storedUser as any);

    const result = await handler.execute({
      dto: { email: 'user@test.com', password: 'correct-password' },
    } as any);

    expect(result).toBe(storedUser);
  });
});
