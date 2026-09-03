import {
  UpdateProfileCommand,
  UpdateProfileHandler,
} from '@/modules/user/application/commands/update-profile.command';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
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

    handler = new UpdateProfileHandler(userRepository);
  });

  it('throws UserNotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateProfileCommand('user-1', { fullName: 'Jane Doe' }),
      ),
    ).rejects.toThrow(UserNotFoundException);
    expect(userRepository.updateProfile).not.toHaveBeenCalled();
  });

  it('forwards the profile patch to the repository when the user exists', async () => {
    userRepository.findById.mockResolvedValue(
      new User({
        id: 'user-1',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
      }),
    );

    const result = await handler.execute(
      new UpdateProfileCommand('user-1', {
        fullName: 'Jane Doe',
        phoneNumber: '0900000000',
      }),
    );

    expect(userRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      fullName: 'Jane Doe',
      phoneNumber: '0900000000',
    });
    expect(result).toEqual({
      message: 'Cập nhật thông tin cá nhân thành công',
    });
  });
});
