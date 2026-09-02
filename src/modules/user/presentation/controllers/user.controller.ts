import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { GetMyProfileQuery } from '@/modules/user/application/queries/get-my-profile.query';
import { UpdateProfileCommand } from '@/modules/user/application/commands/update-profile.command';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ApiResponse } from '@/common/dtos/api-response';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  @ApiOperation({ summary: 'Lấy thông tin profile cá nhân' })
  async getMe(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new GetMyProfileQuery(userId));
    return ApiResponse.ok(result, 'Lấy thông tin profile thành công');
  }

  @Patch('profile')
  @RequirePermissions(Permission.PROFILE_UPDATE_OWN)
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  async updateProfile(
    @GetMe('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateProfileCommand(userId, dto as any),
    );
    return ApiResponse.ok(null, result.message);
  }
}
