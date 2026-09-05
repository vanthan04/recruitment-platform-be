import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPermissionRepository } from '@/modules/permission/domain/repositories/permission.repository';

export class ListPermissionsQuery {}

@Injectable()
@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute() {
    return this.permissionRepository.findAll();
  }
}
