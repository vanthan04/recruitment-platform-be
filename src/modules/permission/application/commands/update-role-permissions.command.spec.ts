import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CannotRemoveLastRbacAdminPermissionException } from '@/modules/permission/domain/exceptions/permission.exceptions';
import {
  UpdateRolePermissionsCommand,
  UpdateRolePermissionsHandler,
} from './update-role-permissions.command';

describe('UpdateRolePermissionsHandler', () => {
  let prisma: any;
  let permissionsService: any;
  let handler: UpdateRolePermissionsHandler;

  beforeEach(() => {
    prisma = {
      role: { findUnique: jest.fn() },
      permission: {
        findMany: jest.fn(),
        // No `role:permission:manage` row by default — the self-lockout
        // guard short-circuits and existing behavior-only tests don't need
        // to know about it. Tests below override this to exercise the guard.
        findUnique: jest.fn().mockResolvedValue(null),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<any>[]) => Promise.all(ops)),
    };
    permissionsService = { invalidateCache: jest.fn() };
    handler = new UpdateRolePermissionsHandler(prisma, permissionsService);
  });

  it('throws EntityNotFoundException when the role does not exist', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateRolePermissionsCommand('missing-role', [])),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException when a permission id does not exist', async () => {
    prisma.role.findUnique.mockResolvedValueOnce({ id: 'role-1' });
    prisma.permission.findMany.mockResolvedValue([{ id: 'perm-1' }]);

    await expect(
      handler.execute(
        new UpdateRolePermissionsCommand('role-1', ['perm-1', 'perm-missing']),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it("replaces the role's permission set atomically and invalidates the cache", async () => {
    prisma.role.findUnique
      .mockResolvedValueOnce({ id: 'role-1' })
      .mockResolvedValueOnce({
        rolePermissions: [{ permission: { id: 'perm-1', name: 'job:create' } }],
      });
    prisma.permission.findMany.mockResolvedValue([{ id: 'perm-1' }]);

    const result = await handler.execute(
      new UpdateRolePermissionsCommand('role-1', ['perm-1']),
    );

    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [{ roleId: 'role-1', permissionId: 'perm-1' }],
    });
    expect(permissionsService.invalidateCache).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'perm-1', name: 'job:create' }]);
  });

  describe('RBAC self-lockout guard', () => {
    beforeEach(() => {
      prisma.permission.findUnique.mockResolvedValue({ id: 'manage-perm' });
    });

    it('refuses to drop role:permission:manage when no other role holds it', async () => {
      prisma.role.findUnique.mockResolvedValueOnce({ id: 'admin-role' });
      prisma.permission.findMany.mockResolvedValue([{ id: 'perm-1' }]);
      prisma.rolePermission.findUnique.mockResolvedValue({
        roleId: 'admin-role',
        permissionId: 'manage-perm',
      });
      prisma.rolePermission.count.mockResolvedValue(0);

      await expect(
        handler.execute(
          new UpdateRolePermissionsCommand('admin-role', ['perm-1']),
        ),
      ).rejects.toThrow(CannotRemoveLastRbacAdminPermissionException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows dropping role:permission:manage when another role still holds it', async () => {
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 'admin-role' })
        .mockResolvedValueOnce({ rolePermissions: [] });
      prisma.permission.findMany.mockResolvedValue([{ id: 'perm-1' }]);
      prisma.rolePermission.findUnique.mockResolvedValue({
        roleId: 'admin-role',
        permissionId: 'manage-perm',
      });
      prisma.rolePermission.count.mockResolvedValue(1);

      await handler.execute(
        new UpdateRolePermissionsCommand('admin-role', ['perm-1']),
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('allows the update when this role never held role:permission:manage in the first place', async () => {
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 'recruiter-role' })
        .mockResolvedValueOnce({ rolePermissions: [] });
      prisma.permission.findMany.mockResolvedValue([{ id: 'perm-1' }]);
      prisma.rolePermission.findUnique.mockResolvedValue(null);

      await handler.execute(
        new UpdateRolePermissionsCommand('recruiter-role', ['perm-1']),
      );

      expect(prisma.rolePermission.count).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('allows the update when the new set still includes role:permission:manage', async () => {
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 'admin-role' })
        .mockResolvedValueOnce({ rolePermissions: [] });
      prisma.permission.findMany.mockResolvedValue([{ id: 'manage-perm' }]);

      await handler.execute(
        new UpdateRolePermissionsCommand('admin-role', ['manage-perm']),
      );

      expect(prisma.rolePermission.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
