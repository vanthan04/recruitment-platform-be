import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';
import { RoleNotFoundException } from '@/modules/permission/domain/exceptions/permission.exceptions';

export class GetRolePermissionsQuery {
  constructor(public readonly roleId: string) {}
}

@Injectable()
@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler implements IQueryHandler<GetRolePermissionsQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute({ roleId }: GetRolePermissionsQuery) {
    const permissions = await this.roleRepository.findPermissionsByRoleId(roleId);
    if (!permissions) throw new RoleNotFoundException(roleId);
    return permissions;
  }
}
