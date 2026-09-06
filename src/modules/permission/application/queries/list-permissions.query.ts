import { Injectable } from '@nestjs/common';
import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPermissionRepository } from '@/modules/permission/domain/repositories/permission.repository';
import { PermissionRecord } from '@/modules/permission/domain/repositories/role.repository';

export class ListPermissionsQuery extends Query<PermissionRecord[]> {}

@Injectable()
@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(): Promise<PermissionRecord[]> {
    return this.permissionRepository.findAll();
  }
}
