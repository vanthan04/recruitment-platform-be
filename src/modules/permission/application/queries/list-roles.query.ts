import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';

export class ListRolesQuery {}

@Injectable()
@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute() {
    return this.roleRepository.findAll();
  }
}
