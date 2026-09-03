import {
  AdminUpdateUserStatusCommand,
  AdminUpdateUserStatusHandler,
} from '@/modules/user/application/commands/admin-update-user-status.command';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';
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

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      updateProfile: jest.fn(),
      findByVerifyCode: jest.fn(),
      findAllPaginated: jest.fn(),
      updateCompanyId: jest.fn(),
    };

    handler = new AdminUpdateUserStatusHandler(userRepository);
  });

  it('throws UserNotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new AdminUpdateUserStatusCommand('user-1', {
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
      new AdminUpdateUserStatusCommand('user-1', {
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
      new AdminUpdateUserStatusCommand('user-1', { role: UserRole.RECRUITER }),
    );

    expect(user.role).toBe(UserRole.RECRUITER);
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('changes both status and role when both are given', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (u) => u as User);

    const result = await handler.execute(
      new AdminUpdateUserStatusCommand('user-1', {
        status: UserStatus.BLOCKED,
        role: UserRole.RECRUITER,
      }),
    );

    expect(user.status).toBe(UserStatus.BLOCKED);
    expect(user.role).toBe(UserRole.RECRUITER);
    expect(result).toEqual({
      message: 'Cập nhật trạng thái người dùng thành công',
    });
  });
});
