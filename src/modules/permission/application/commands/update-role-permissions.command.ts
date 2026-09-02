import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { PermissionsService } from '@/modules/permission/application/permissions.service';
import {
  RoleNotFoundException,
  PermissionNotFoundException,
} from '@/modules/permission/domain/exceptions/permission.exceptions';

export class UpdateRolePermissionsCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionIds: string[],
  ) {}
}

// Lets an admin change what a role can do purely through data — e.g. turning
// on `job:delete` for RECRUITER takes effect for every subsequent request
// with no code change or redeploy, because PermissionGuard always re-reads
// role_permissions (bounded only by the short-lived cache, which this
// handler explicitly invalidates below).
@Injectable()
@CommandHandler(UpdateRolePermissionsCommand)
export class UpdateRolePermissionsHandler implements ICommandHandler<UpdateRolePermissionsCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute({ roleId, permissionIds }: UpdateRolePermissionsCommand) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new RoleNotFoundException(roleId);

    const uniqueIds = Array.from(new Set(permissionIds));
    const existing = await this.prisma.permission.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (existing.length !== uniqueIds.length) {
      const foundIds = new Set(existing.map((p) => p.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      throw new PermissionNotFoundException(missing.join(', '));
    }

    // Replace the role's full permission set atomically.
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: uniqueIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);

    this.permissionsService.invalidateCache();

    const updated = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return updated!.rolePermissions.map((rp) => rp.permission);
  }
}
