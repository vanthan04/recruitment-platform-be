export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionRecord {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Role Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 * Mirrors the pattern every other module already uses; the RBAC application
 * layer previously injected PrismaService directly instead of going through
 * a port like this.
 */
export abstract class IRoleRepository {
  abstract findAll(): Promise<RoleRecord[]>;
  abstract findById(id: string): Promise<RoleRecord | null>;
  /** null means the role itself doesn't exist (as opposed to existing with zero permissions). */
  abstract findPermissionNamesByRoleName(
    roleName: string,
  ): Promise<string[] | null>;
  /** null means the role itself doesn't exist. */
  abstract findPermissionsByRoleId(
    roleId: string,
  ): Promise<PermissionRecord[] | null>;
  abstract roleGrantsPermissionId(
    roleId: string,
    permissionId: string,
  ): Promise<boolean>;
  abstract countOtherRolesGrantingPermissionId(
    permissionId: string,
    excludingRoleId: string,
  ): Promise<number>;
  /** Atomically replaces a role's full permission set. */
  abstract replacePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void>;
}
