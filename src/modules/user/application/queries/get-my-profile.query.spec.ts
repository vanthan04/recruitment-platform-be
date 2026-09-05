import {
  GetMyProfileQuery,
  GetMyProfileHandler,
} from '@/modules/user/application/queries/get-my-profile.query';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';

describe('GetMyProfileHandler', () => {
  let handler: GetMyProfileHandler;
  let userRepository: jest.Mocked<IUserRepository>;

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
    };

    handler = new GetMyProfileHandler(userRepository);
  });

  it('throws UserNotFoundException when the user does not exist', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMyProfileQuery('user-1')),
    ).rejects.toThrow(UserNotFoundException);
  });

  it('strips password from the returned profile', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue(
      new User({
        id: 'user-1',
        email: 'candidate@example.com',
        password: 'hashed-secret',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
      }),
    );

    const result = await handler.execute(new GetMyProfileQuery('user-1'));

    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('candidate@example.com');
  });
});
