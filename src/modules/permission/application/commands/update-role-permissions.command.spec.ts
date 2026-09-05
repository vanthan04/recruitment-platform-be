import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CannotRemoveLastRbacAdminPermissionException } from '@/modules/permission/domain/exceptions/permission.exceptions';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';
import { IPermissionRepository } from '@/modules/permission/domain/repositories/permission.repository';
import { PermissionsService } from '@/modules/permission/application/permissions.service';
import {
  UpdateRolePermissionsCommand,
  UpdateRolePermissionsHandler,
} from './update-role-permissions.command';

describe('UpdateRolePermissionsHandler', () => {
  let roleRepository: jest.Mocked<IRoleRepository>;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let permissionsService: jest.Mocked<PermissionsService>;
  let handler: UpdateRolePermissionsHandler;

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
    permissionRepository = {
      findAll: jest.fn(),
      findExistingIds: jest.fn(),
      // No `role:permission:manage` row by default — the self-lockout guard
      // short-circuits and existing behavior-only tests don't need to know
      // about it. Tests below override this to exercise the guard.
      findIdByName: jest.fn().mockResolvedValue(null),
    };
    permissionsService = { invalidateCache: jest.fn() } as any;
    handler = new UpdateRolePermissionsHandler(
      roleRepository,
      permissionRepository,
      permissionsService,
    );
  });

  it('throws EntityNotFoundException when the role does not exist', async () => {
    roleRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateRolePermissionsCommand('missing-role', [])),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException when a permission id does not exist', async () => {
    roleRepository.findById.mockResolvedValue({
      id: 'role-1',
      name: 'RECRUITER',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    permissionRepository.findExistingIds.mockResolvedValue(new Set(['perm-1']));

    await expect(
      handler.execute(
        new UpdateRolePermissionsCommand('role-1', ['perm-1', 'perm-missing']),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it("replaces the role's permission set atomically and invalidates the cache", async () => {
    roleRepository.findById.mockResolvedValue({
      id: 'role-1',
      name: 'RECRUITER',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    permissionRepository.findExistingIds.mockResolvedValue(new Set(['perm-1']));
    roleRepository.findPermissionsByRoleId.mockResolvedValue([
      { id: 'perm-1', name: 'job:create', description: null },
    ]);

    const result = await handler.execute(
      new UpdateRolePermissionsCommand('role-1', ['perm-1']),
    );

    expect(roleRepository.replacePermissions).toHaveBeenCalledWith('role-1', [
      'perm-1',
    ]);
    expect(permissionsService.invalidateCache).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'perm-1', name: 'job:create', description: null }]);
  });

  describe('RBAC self-lockout guard', () => {
    beforeEach(() => {
      permissionRepository.findIdByName.mockResolvedValue('manage-perm');
      roleRepository.findPermissionsByRoleId.mockResolvedValue([]);
    });

    it('refuses to drop role:permission:manage when no other role holds it', async () => {
      roleRepository.findById.mockResolvedValue({
        id: 'admin-role',
        name: 'ADMIN',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      permissionRepository.findExistingIds.mockResolvedValue(new Set(['perm-1']));
      roleRepository.roleGrantsPermissionId.mockResolvedValue(true);
      roleRepository.countOtherRolesGrantingPermissionId.mockResolvedValue(0);

      await expect(
        handler.execute(
          new UpdateRolePermissionsCommand('admin-role', ['perm-1']),
        ),
      ).rejects.toThrow(CannotRemoveLastRbacAdminPermissionException);
      expect(roleRepository.replacePermissions).not.toHaveBeenCalled();
    });

    it('allows dropping role:permission:manage when another role still holds it', async () => {
      roleRepository.findById.mockResolvedValue({
        id: 'admin-role',
        name: 'ADMIN',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      permissionRepository.findExistingIds.mockResolvedValue(new Set(['perm-1']));
      roleRepository.roleGrantsPermissionId.mockResolvedValue(true);
      roleRepository.countOtherRolesGrantingPermissionId.mockResolvedValue(1);

      await handler.execute(
        new UpdateRolePermissionsCommand('admin-role', ['perm-1']),
      );

      expect(roleRepository.replacePermissions).toHaveBeenCalled();
    });

    it('allows the update when this role never held role:permission:manage in the first place', async () => {
      roleRepository.findById.mockResolvedValue({
        id: 'recruiter-role',
        name: 'RECRUITER',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      permissionRepository.findExistingIds.mockResolvedValue(new Set(['perm-1']));
      roleRepository.roleGrantsPermissionId.mockResolvedValue(false);

      await handler.execute(
        new UpdateRolePermissionsCommand('recruiter-role', ['perm-1']),
      );

      expect(
        roleRepository.countOtherRolesGrantingPermissionId,
      ).not.toHaveBeenCalled();
      expect(roleRepository.replacePermissions).toHaveBeenCalled();
    });

    it('allows the update when the new set still includes role:permission:manage', async () => {
      roleRepository.findById.mockResolvedValue({
        id: 'admin-role',
        name: 'ADMIN',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      permissionRepository.findExistingIds.mockResolvedValue(
        new Set(['manage-perm']),
      );

      await handler.execute(
        new UpdateRolePermissionsCommand('admin-role', ['manage-perm']),
      );

      expect(roleRepository.roleGrantsPermissionId).not.toHaveBeenCalled();
      expect(roleRepository.replacePermissions).toHaveBeenCalled();
    });
  });
});
