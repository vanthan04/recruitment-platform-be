import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';
import { AdminListUsersQuery } from '@/modules/user/application/queries/admin-list-users.query';
import { AdminUpdateUserStatusCommand } from '@/modules/user/application/commands/admin-update-user-status.command';
import { AdminUpdateUserStatusDto } from '../dtos/admin-update-user-status.dto';
import { AdminListUsersDto } from '../dtos/admin-list-users.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/users')
export class UserAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'List users (Admin)' })
  async listUsers(@Query() query: AdminListUsersDto) {
    const result = await this.queryBus.execute(
      new AdminListUsersQuery(query.page, query.limit),
    );
    return ApiResponse.ok(result.users, 'User list retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Patch(':id')
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({
    summary: "Update a user's status or role (Admin)",
  })
  async updateStatus(
    @GetMe('id') actingAdminId: string,
    @Param('id') userId: string,
    @Body() dto: AdminUpdateUserStatusDto,
  ) {
    const result = await this.commandBus.execute(
      new AdminUpdateUserStatusCommand(actingAdminId, userId, dto),
    );
    return ApiResponse.ok(null, result.message);
  }
}
