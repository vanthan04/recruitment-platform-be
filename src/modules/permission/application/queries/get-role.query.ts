import { Injectable } from '@nestjs/common';
import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IRoleRepository,
  RoleRecord,
} from '@/modules/permission/domain/repositories/role.repository';
import { RoleNotFoundException } from '@/modules/permission/domain/exceptions/permission.exceptions';

export class GetRoleQuery extends Query<RoleRecord> {
  constructor(public readonly roleId: string) {
    super();
  }
}

@Injectable()
@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute({ roleId }: GetRoleQuery): Promise<RoleRecord> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundException(roleId);
    return role;
  }
}
