import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
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
      permission: { findMany: jest.fn() },
      rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
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
});
