import {
  AdminListUsersQuery,
  AdminListUsersHandler,
} from '@/modules/user/application/queries/admin-list-users.query';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';

describe('AdminListUsersHandler', () => {
  let handler: AdminListUsersHandler;
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

    handler = new AdminListUsersHandler(userRepository);
  });

  it('normalizes an invalid page/limit before querying the repository', async () => {
    userRepository.findAllPaginated.mockResolvedValue({ users: [], total: 0 });

    const result = await handler.execute(new AdminListUsersQuery(-1, NaN));

    expect(userRepository.findAllPaginated).toHaveBeenCalledWith(1, 10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('strips password and verifyCode from every returned user', async () => {
    userRepository.findAllPaginated.mockResolvedValue({
      users: [
        new User({
          id: 'user-1',
          email: 'candidate@example.com',
          password: 'hashed-secret',
          verifyCode: 'secret-code',
          role: UserRole.CANDIDATE,
          status: UserStatus.ACTIVE,
        }),
      ],
      total: 1,
    });

    const result = await handler.execute(new AdminListUsersQuery(1, 10));

    expect(result.users).toHaveLength(1);
    expect(result.users[0]).not.toHaveProperty('password');
    expect(result.users[0]).not.toHaveProperty('verifyCode');
    expect(result.total).toBe(1);
  });
});
