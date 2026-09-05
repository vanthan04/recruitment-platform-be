import { PermissionRecord } from '@/modules/permission/domain/repositories/role.repository';

/**
 * Permission Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 */
export abstract class IPermissionRepository {
  abstract findAll(): Promise<PermissionRecord[]>;
  /** Returns the subset of `ids` that actually exist. */
  abstract findExistingIds(ids: string[]): Promise<Set<string>>;
  abstract findIdByName(name: string): Promise<string | null>;
}
