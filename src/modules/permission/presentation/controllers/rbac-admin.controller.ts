import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ListRolesQuery } from '@/modules/permission/application/queries/list-roles.query';
import { GetRoleQuery } from '@/modules/permission/application/queries/get-role.query';
import { ListPermissionsQuery } from '@/modules/permission/application/queries/list-permissions.query';
import { GetRolePermissionsQuery } from '@/modules/permission/application/queries/get-role-permissions.query';
import { UpdateRolePermissionsCommand } from '@/modules/permission/application/commands/update-role-permissions.command';
import { UpdateRolePermissionsDto } from '@/modules/permission/presentation/dtos/update-role-permissions.dto';

@ApiTags('admin/rbac')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions(Permission.ROLE_PERMISSION_MANAGE)
@Controller('admin')
export class RbacAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all roles (Admin)' })
  async listRoles() {
    const result = await this.queryBus.execute(new ListRolesQuery());
    return ApiResponse.ok(result, 'Roles retrieved successfully');
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a role by id (Admin)' })
  async getRole(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetRoleQuery(id));
    return ApiResponse.ok(result, 'Role retrieved successfully');
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all permissions (Admin)' })
  async listPermissions() {
    const result = await this.queryBus.execute(new ListPermissionsQuery());
    return ApiResponse.ok(result, 'Permissions retrieved successfully');
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: "List a role's assigned permissions (Admin)" })
  async getRolePermissions(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetRolePermissionsQuery(id));
    return ApiResponse.ok(result, 'Role permissions retrieved successfully');
  }

  @Put('roles/:id/permissions')
  @ApiOperation({ summary: "Replace a role's permission assignments (Admin)" })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateRolePermissionsCommand(id, dto.permissionIds),
    );
    return ApiResponse.ok(result, 'Role permissions updated successfully');
  }
}
