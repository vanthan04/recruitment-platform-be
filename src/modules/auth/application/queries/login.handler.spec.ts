import * as bcrypt from 'bcrypt';
import { LoginHandler } from '@/modules/auth/application/queries/login.query';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import {
  InvalidCredentialsException,
  AccountBlockedException,
  EmailNotVerifiedException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserStatus } from '@/common/enums/user-status.enum';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    };
    handler = new LoginHandler(userRepository);
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
});
