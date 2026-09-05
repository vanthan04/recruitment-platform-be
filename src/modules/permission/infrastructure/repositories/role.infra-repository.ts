import { Injectable } from '@nestjs/common';
import {
  IRoleRepository,
  RoleRecord,
  PermissionRecord,
} from '@/modules/permission/domain/repositories/role.repository';
import { RolePrismaRepository } from '@/modules/permission/infrastructure/persistence/prisma/role-prisma.repository';

@Injectable()
export class RoleInfraRepository implements IRoleRepository {
  constructor(private readonly rolePrisma: RolePrismaRepository) {}

  async findAll(): Promise<RoleRecord[]> {
    return this.rolePrisma.findAll();
  }

  async findById(id: string): Promise<RoleRecord | null> {
    return this.rolePrisma.findById(id);
  }

  async findPermissionNamesByRoleName(
    roleName: string,
  ): Promise<string[] | null> {
    const role = await this.rolePrisma.findByNameWithPermissions(roleName);
    if (!role) return null;
    return role.rolePermissions.map((rp) => rp.permission.name);
  }

  async findPermissionsByRoleId(
    roleId: string,
  ): Promise<PermissionRecord[] | null> {
    const role = await this.rolePrisma.findByIdWithPermissions(roleId);
    if (!role) return null;
    return role.rolePermissions.map((rp) => rp.permission);
  }

  async roleGrantsPermissionId(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    return this.rolePrisma.roleGrantsPermissionId(roleId, permissionId);
  }

  async countOtherRolesGrantingPermissionId(
    permissionId: string,
    excludingRoleId: string,
  ): Promise<number> {
    return this.rolePrisma.countOtherRolesGrantingPermissionId(
      permissionId,
      excludingRoleId,
    );
  }

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.rolePrisma.replacePermissions(roleId, permissionIds);
  }
}
