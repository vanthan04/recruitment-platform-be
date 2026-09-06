import { Injectable } from '@nestjs/common';
import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IRoleRepository,
  RoleRecord,
} from '@/modules/permission/domain/repositories/role.repository';

export class ListRolesQuery extends Query<RoleRecord[]> {}

@Injectable()
@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(): Promise<RoleRecord[]> {
    return this.roleRepository.findAll();
  }
}
