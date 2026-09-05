import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RbacAdminController } from '@/modules/permission/presentation/controllers/rbac-admin.controller';
import { PermissionsService } from '@/modules/permission/application/permissions.service';

import { IRoleRepository } from '@/modules/permission/domain/repositories/role.repository';
import { RoleInfraRepository } from '@/modules/permission/infrastructure/repositories/role.infra-repository';
import { RolePrismaRepository } from '@/modules/permission/infrastructure/persistence/prisma/role-prisma.repository';
import { IPermissionRepository } from '@/modules/permission/domain/repositories/permission.repository';
import { PermissionInfraRepository } from '@/modules/permission/infrastructure/repositories/permission.infra-repository';
import { PermissionPrismaRepository } from '@/modules/permission/infrastructure/persistence/prisma/permission-prisma.repository';

import { ListRolesHandler } from '@/modules/permission/application/queries/list-roles.query';
import { GetRoleHandler } from '@/modules/permission/application/queries/get-role.query';
import { ListPermissionsHandler } from '@/modules/permission/application/queries/list-permissions.query';
import { GetRolePermissionsHandler } from '@/modules/permission/application/queries/get-role-permissions.query';
import { UpdateRolePermissionsHandler } from '@/modules/permission/application/commands/update-role-permissions.command';

// @Global() so PermissionGuard (used via @UseGuards() on controllers across
// every feature module, the same way JwtAuthGuard/RolesGuard already are)
// can resolve PermissionsService regardless of which module declares the
// controller it's guarding — mirrors how PrismaModule is registered.
@Global()
@Module({
  imports: [CqrsModule],
  controllers: [RbacAdminController],
  providers: [
    RolePrismaRepository,
    PermissionPrismaRepository,
    {
      provide: IRoleRepository,
      useClass: RoleInfraRepository,
    },
    {
      provide: IPermissionRepository,
      useClass: PermissionInfraRepository,
    },
    PermissionsService,
    ListRolesHandler,
    GetRoleHandler,
    ListPermissionsHandler,
    GetRolePermissionsHandler,
    UpdateRolePermissionsHandler,
  ],
  exports: [PermissionsService],
})
export class PermissionModule {}
