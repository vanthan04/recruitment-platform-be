import { Injectable } from '@nestjs/common';
import {
  IPermissionRepository,
} from '@/modules/permission/domain/repositories/permission.repository';
import { PermissionRecord } from '@/modules/permission/domain/repositories/role.repository';
import { PermissionPrismaRepository } from '@/modules/permission/infrastructure/persistence/prisma/permission-prisma.repository';

@Injectable()
export class PermissionInfraRepository implements IPermissionRepository {
  constructor(
    private readonly permissionPrisma: PermissionPrismaRepository,
  ) {}

  async findAll(): Promise<PermissionRecord[]> {
    return this.permissionPrisma.findAll();
  }

  async findExistingIds(ids: string[]): Promise<Set<string>> {
    const rows = await this.permissionPrisma.findManyByIds(ids);
    return new Set(rows.map((r) => r.id));
  }

  async findIdByName(name: string): Promise<string | null> {
    const row = await this.permissionPrisma.findByName(name);
    return row?.id ?? null;
  }
}
