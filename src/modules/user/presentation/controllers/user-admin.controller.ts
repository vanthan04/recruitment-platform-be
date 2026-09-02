import { Controller, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { AdminListUsersQuery } from '@/modules/user/application/queries/admin-list-users.query';
import { AdminUpdateUserStatusCommand } from '@/modules/user/application/commands/admin-update-user-status.command';
import { AdminUpdateUserStatusDto } from '../dtos/admin-update-user-status.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UserAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.queryBus.execute(new AdminListUsersQuery(page, limit));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trạng thái hoặc quyền hạn người dùng (Admin)' })
  async updateStatus(@Param('id') userId: string, @Body() dto: AdminUpdateUserStatusDto) {
    return this.commandBus.execute(new AdminUpdateUserStatusCommand(userId, dto));
  }
}
