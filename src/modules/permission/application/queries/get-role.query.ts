import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';
import { RoleNotFoundException } from '@/modules/permission/domain/exceptions/permission.exceptions';

export class GetRoleQuery {
  constructor(public readonly roleId: string) {}
}

@Injectable()
@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute({ roleId }: GetRoleQuery) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundException(roleId);
    return role;
  }
}
