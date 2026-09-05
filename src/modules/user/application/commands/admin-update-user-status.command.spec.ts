import {
  AdminUpdateUserStatusCommand,
  AdminUpdateUserStatusHandler,
} from '@/modules/user/application/commands/admin-update-user-status.command';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { ISessionRevocationPort } from '@/modules/user/application/ports/session-revocation.port';
import {
  UserNotFoundException,
  CannotModifyOwnAccountException,
  CannotRemoveLastAdminException,
} from '@/modules/user/domain/exceptions/user.exceptions';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';

function makeUser(overrides: Partial<User> = {}): User {
  return new User({
    id: 'user-1',
    email: 'candidate@example.com',
    role: UserRole.CANDIDATE,
    status: UserStatus.ACTIVE,
    ...overrides,
  });
}

describe('AdminUpdateUserStatusHandler', () => {
  let handler: AdminUpdateUserStatusHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let sessionRevocation: jest.Mocked<ISessionRevocationPort>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      updateProfile: jest.fn(),
      findAllPaginated: jest.fn(),
      updateCompanyId: jest.fn(),
      countActiveAdmins: jest.fn().mockResolvedValue(5),
    };
    sessionRevocation = {
      revokeAllForUser: jest.fn(),
    };

    handler = new AdminUpdateUserStatusHandler(userRepository, sessionRevocation);
  });

  it('throws UserNotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
          status: UserStatus.BLOCKED,
        }),
      ),
    ).rejects.toThrow(UserNotFoundException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('changes only status when only status is given', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
        status: UserStatus.BLOCKED,
      }),
    );

    expect(user.status).toBe(UserStatus.BLOCKED);
    expect(user.role).toBe(UserRole.CANDIDATE);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it('changes only role when only role is given', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
        role: UserRole.RECRUITER,
      }),
    );

    expect(user.role).toBe(UserRole.RECRUITER);
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('changes both status and role when both are given', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    const result = await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
        status: UserStatus.BLOCKED,
        role: UserRole.RECRUITER,
      }),
    );

    expect(user.status).toBe(UserStatus.BLOCKED);
    expect(user.role).toBe(UserRole.RECRUITER);
    expect(result).toEqual({
      message: 'User status updated successfully',
    });
  });

  it('revokes all refresh tokens when a user is blocked', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
        status: UserStatus.BLOCKED,
      }),
    );

    expect(sessionRevocation.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('does not revoke sessions for a non-blocking status change', async () => {
    const user = makeUser({ status: UserStatus.PENDING });
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'user-1', {
        status: UserStatus.ACTIVE,
      }),
    );

    expect(sessionRevocation.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('throws when an admin tries to block their own account', async () => {
    const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
    userRepository.findById.mockResolvedValue(admin);

    await expect(
      handler.execute(
        new AdminUpdateUserStatusCommand('admin-1', 'admin-1', {
          status: UserStatus.BLOCKED,
        }),
      ),
    ).rejects.toThrow(CannotModifyOwnAccountException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('throws when an admin tries to demote their own role', async () => {
    const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
    userRepository.findById.mockResolvedValue(admin);

    await expect(
      handler.execute(
        new AdminUpdateUserStatusCommand('admin-1', 'admin-1', {
          role: UserRole.CANDIDATE,
        }),
      ),
    ).rejects.toThrow(CannotModifyOwnAccountException);
  });

  it('throws when blocking the last active admin', async () => {
    const admin = makeUser({ id: 'admin-2', role: UserRole.ADMIN });
    userRepository.findById.mockResolvedValue(admin);
    userRepository.countActiveAdmins.mockResolvedValue(1);

    await expect(
      handler.execute(
        new AdminUpdateUserStatusCommand('admin-1', 'admin-2', {
          status: UserStatus.BLOCKED,
        }),
      ),
    ).rejects.toThrow(CannotRemoveLastAdminException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('allows blocking an admin when other active admins remain', async () => {
    const admin = makeUser({ id: 'admin-2', role: UserRole.ADMIN });
    userRepository.findById.mockResolvedValue(admin);
    userRepository.countActiveAdmins.mockResolvedValue(2);
    userRepository.save.mockImplementation(async (u) => u as User);

    await handler.execute(
      new AdminUpdateUserStatusCommand('admin-1', 'admin-2', {
        status: UserStatus.BLOCKED,
      }),
    );

    expect(admin.status).toBe(UserStatus.BLOCKED);
  });
});
