import { Injectable } from '@nestjs/common';
import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IRoleRepository,
  PermissionRecord,
} from '@/modules/permission/domain/repositories/role.repository';
import { RoleNotFoundException } from '@/modules/permission/domain/exceptions/permission.exceptions';

export class GetRolePermissionsQuery extends Query<PermissionRecord[]> {
  constructor(public readonly roleId: string) {
    super();
  }
}

@Injectable()
@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler implements IQueryHandler<GetRolePermissionsQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute({
    roleId,
  }: GetRolePermissionsQuery): Promise<PermissionRecord[]> {
    const permissions =
      await this.roleRepository.findPermissionsByRoleId(roleId);
    if (!permissions) throw new RoleNotFoundException(roleId);
    return permissions;
  }
}
