import { PermissionsService } from './permissions.service';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';

describe('PermissionsService', () => {
  let roleRepository: jest.Mocked<IRoleRepository>;
  let service: PermissionsService;

  beforeEach(() => {
    roleRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findPermissionNamesByRoleName: jest.fn(),
      findPermissionsByRoleId: jest.fn(),
      roleGrantsPermissionId: jest.fn(),
      countOtherRolesGrantingPermissionId: jest.fn(),
      replacePermissions: jest.fn(),
    };
    service = new PermissionsService(roleRepository);
  });

  it('returns the permission names granted to a role via the repository', async () => {
    roleRepository.findPermissionNamesByRoleName.mockResolvedValue([
      'job:create',
      'job:update',
    ]);

    const permissions = await service.getPermissionsForRole('RECRUITER');

    expect(permissions).toEqual(new Set(['job:create', 'job:update']));
    expect(roleRepository.findPermissionNamesByRoleName).toHaveBeenCalledWith(
      'RECRUITER',
    );
  });

  it('returns an empty set for a role that does not exist', async () => {
    roleRepository.findPermissionNamesByRoleName.mockResolvedValue(null);

    const permissions = await service.getPermissionsForRole('UNKNOWN');

    expect(permissions).toEqual(new Set());
  });

  it('caches the result and does not re-query within the TTL', async () => {
    roleRepository.findPermissionNamesByRoleName.mockResolvedValue([]);

    await service.getPermissionsForRole('ADMIN');
    await service.getPermissionsForRole('ADMIN');

    expect(roleRepository.findPermissionNamesByRoleName).toHaveBeenCalledTimes(
      1,
    );
  });

  it('re-queries the database after invalidateCache() so a permission change takes effect immediately', async () => {
    roleRepository.findPermissionNamesByRoleName.mockResolvedValue([]);

    await service.getPermissionsForRole('ADMIN');
    service.invalidateCache();
    await service.getPermissionsForRole('ADMIN');

    expect(roleRepository.findPermissionNamesByRoleName).toHaveBeenCalledTimes(
      2,
    );
  });
});
