import * as bcrypt from 'bcrypt';
import {
  ChangePasswordCommand,
  ChangePasswordHandler,
} from '@/modules/auth/application/commands/change-password.command';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import {
  UserNotFoundException,
  InvalidOldPasswordException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { USER_SESSION_REVOKED_EVENT } from '@/modules/user/infrastructure/events/user-session-revoked.event';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

const hashPassword = (plain: string) => bcrypt.hash(plain, 4);

const buildUser = async (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  email: 'candidate@example.com',
  password: await hashPassword('correct-old-pass'),
  role: UserRole.CANDIDATE,
  status: UserStatus.ACTIVE,
  ...overrides,
});

describe('ChangePasswordHandler', () => {
  let handler: ChangePasswordHandler;
  let userRepository: jest.Mocked<IAuthUserRepositoryPort>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepositoryPort>;
  let eventEmitter: { emit: jest.Mock };

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
    eventEmitter = { emit: jest.fn() };
    handler = new ChangePasswordHandler(
      userRepository,
      refreshTokenRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('throws UserNotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new ChangePasswordCommand('user-1', {
          oldPassword: 'old-pass',
          newPassword: 'new-pass123',
        }),
      ),
    ).rejects.toThrow(UserNotFoundException);
    expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('throws InvalidOldPasswordException when the old password does not match', async () => {
    userRepository.findById.mockResolvedValue((await buildUser()) as any);

    await expect(
      handler.execute(
        new ChangePasswordCommand('user-1', {
          oldPassword: 'wrong-old-pass',
          newPassword: 'new-pass123',
        }),
      ),
    ).rejects.toThrow(InvalidOldPasswordException);
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('hashes the new password, saves it, and revokes every existing session', async () => {
    userRepository.findById.mockResolvedValue((await buildUser()) as any);
    userRepository.save.mockImplementation(async (u) => u as any);

    await handler.execute(
      new ChangePasswordCommand('user-1', {
        oldPassword: 'correct-old-pass',
        newPassword: 'new-pass123',
      }),
    );

    const saveArgs = userRepository.save.mock.calls[0][0] as any;
    expect(saveArgs.password).not.toBe('new-pass123');
    expect(await bcrypt.compare('new-pass123', saveArgs.password)).toBe(true);

    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
      'user-1',
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      USER_SESSION_REVOKED_EVENT,
      expect.objectContaining({ userId: 'user-1' }),
    );
  });
});
