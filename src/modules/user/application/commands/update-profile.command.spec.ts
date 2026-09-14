import {
  UpdateProfileCommand,
  UpdateProfileHandler,
} from '@/modules/user/application/commands/update-profile.command';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import {
  UserNotFoundException,
  InvalidAvatarUrlException,
} from '@/modules/user/domain/exceptions/user.exceptions';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let fileStorage: jest.Mocked<IFileStorageProvider>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      findManyByIdsWithProfile: jest.fn(),
      findByGoogleId: jest.fn(),
      findByFacebookId: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      updateProfile: jest.fn(),
      findAllPaginated: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    fileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
      uploadBuffer: jest.fn(),
      deleteByKey: jest.fn(),
      getSignedUrl: jest.fn(),
      downloadBuffer: jest.fn(),
      isOwnedUrl: jest.fn().mockReturnValue(true),
    };

    handler = new UpdateProfileHandler(userRepository, fileStorage);
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
      message: 'Profile updated successfully',
    });
  });

  it('rejects an avatarUrl that is not one of our own upload URLs', async () => {
    userRepository.findById.mockResolvedValue(
      new User({
        id: 'user-1',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
      }),
    );
    fileStorage.isOwnedUrl.mockReturnValue(false);

    await expect(
      handler.execute(
        new UpdateProfileCommand('user-1', {
          avatarUrl: 'https://attacker.example/track.png',
        }),
      ),
    ).rejects.toThrow(InvalidAvatarUrlException);
    expect(userRepository.updateProfile).not.toHaveBeenCalled();
  });

  it('accepts an avatarUrl that is one of our own upload URLs', async () => {
    userRepository.findById.mockResolvedValue(
      new User({
        id: 'user-1',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
      }),
    );
    fileStorage.isOwnedUrl.mockReturnValue(true);

    await handler.execute(
      new UpdateProfileCommand('user-1', {
        avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/x.jpg',
      }),
    );

    expect(userRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/x.jpg',
    });
  });
});
