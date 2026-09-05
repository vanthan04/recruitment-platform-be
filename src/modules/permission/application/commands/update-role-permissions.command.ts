import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { PermissionsService } from '@/modules/permission/application/permissions.service';
import { Permission } from '@/common/enums/permission.enum';
import {
  RoleNotFoundException,
  PermissionNotFoundException,
  CannotRemoveLastRbacAdminPermissionException,
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

    await this.ensureRbacAdministrationSurvives(roleId, uniqueIds);

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

  /**
   * RBAC self-lockout guard: if this write would leave zero roles holding
   * `role:permission:manage`, no one — including the admin making this very
   * call — could reach this endpoint again to fix it. Only a manual DB write
   * could recover from that, so refuse it up front instead.
   */
  private async ensureRbacAdministrationSurvives(
    roleId: string,
    newPermissionIds: string[],
  ): Promise<void> {
    const managePermission = await this.prisma.permission.findUnique({
      where: { name: Permission.ROLE_PERMISSION_MANAGE },
      select: { id: true },
    });
    // Seed data may not exist yet in a fresh/test environment — nothing to protect.
    if (!managePermission) return;

    const wouldStillGrantIt = newPermissionIds.includes(managePermission.id);
    if (wouldStillGrantIt) return;

    const currentlyGrantsIt = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId: managePermission.id },
      },
    });
    // This role never had it — removing it from the payload changes nothing.
    if (!currentlyGrantsIt) return;

    const otherHolders = await this.prisma.rolePermission.count({
      where: { permissionId: managePermission.id, roleId: { not: roleId } },
    });
    if (otherHolders === 0) {
      throw new CannotRemoveLastRbacAdminPermissionException();
    }
  }
}
