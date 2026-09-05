import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';

interface CacheEntry {
  expiresAt: number;
  permissions: Set<string>;
}

// Role -> permission names is looked up straight from the DB (roles join
// role_permissions join permissions, a single query — no N+1). The only
// optimization is a tiny in-process TTL cache keyed by role name: no Redis,
// no external infra, just enough to avoid hitting Postgres on every request.
// Cache entries self-expire after CACHE_TTL_MS, and any RBAC admin write
// (see UpdateRolePermissionsHandler) calls invalidate() so a permission
// change takes effect immediately instead of waiting out the TTL.
@Injectable()
export class PermissionsService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(private readonly roleRepository: IRoleRepository) {}

  async getPermissionsForRole(roleName: string): Promise<Set<string>> {
    const cached = this.cache.get(roleName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const names =
      await this.roleRepository.findPermissionNamesByRoleName(roleName);
    const permissions = new Set(names ?? []);
    this.cache.set(roleName, {
      expiresAt: Date.now() + this.CACHE_TTL_MS,
      permissions,
    });
    return permissions;
  }

  invalidateCache(): void {
    this.cache.clear();
  }
}
