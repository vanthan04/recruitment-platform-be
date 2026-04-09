import { Controller, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/presentation/security/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { AdminListUsersUseCase } from '@/modules/user/application/use-cases/admin-list-users.use-case';
import { AdminUpdateUserStatusUseCase } from '@/modules/user/application/use-cases/admin-update-user-status.use-case';
import { AdminUpdateUserStatusDto } from '../dtos/admin-update-user-status.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UserAdminController {
  constructor(
    private readonly adminListUsersUseCase: AdminListUsersUseCase,
    private readonly adminUpdateUserStatusUseCase: AdminUpdateUserStatusUseCase,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminListUsersUseCase.execute(page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trạng thái hoặc quyền hạn người dùng (Admin)' })
  async updateStatus(@Param('id') userId: string, @Body() dto: AdminUpdateUserStatusDto) {
    return this.adminUpdateUserStatusUseCase.execute(userId, dto);
  }
}
