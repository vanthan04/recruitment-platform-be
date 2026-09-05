import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';
import { IPermissionRepository } from '@/modules/permission/domain/repositories/permission.repository';
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
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute({ roleId, permissionIds }: UpdateRolePermissionsCommand) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundException(roleId);

    const uniqueIds = Array.from(new Set(permissionIds));
    const existingIds = await this.permissionRepository.findExistingIds(uniqueIds);
    if (existingIds.size !== uniqueIds.length) {
      const missing = uniqueIds.filter((id) => !existingIds.has(id));
      throw new PermissionNotFoundException(missing.join(', '));
    }

    await this.ensureRbacAdministrationSurvives(roleId, uniqueIds);

    // Replace the role's full permission set atomically.
    await this.roleRepository.replacePermissions(roleId, uniqueIds);

    this.permissionsService.invalidateCache();

    return await this.roleRepository.findPermissionsByRoleId(roleId);
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
    const managePermissionId = await this.permissionRepository.findIdByName(
      Permission.ROLE_PERMISSION_MANAGE,
    );
    // Seed data may not exist yet in a fresh/test environment — nothing to protect.
    if (!managePermissionId) return;

    const wouldStillGrantIt = newPermissionIds.includes(managePermissionId);
    if (wouldStillGrantIt) return;

    const currentlyGrantsIt = await this.roleRepository.roleGrantsPermissionId(
      roleId,
      managePermissionId,
    );
    // This role never had it — removing it from the payload changes nothing.
    if (!currentlyGrantsIt) return;

    const otherHolders =
      await this.roleRepository.countOtherRolesGrantingPermissionId(
        managePermissionId,
        roleId,
      );
    if (otherHolders === 0) {
      throw new CannotRemoveLastRbacAdminPermissionException();
    }
  }
}
