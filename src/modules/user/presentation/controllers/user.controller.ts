import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { GetMyProfileQuery } from '@/modules/user/application/queries/get-my-profile.query';
import { UpdateProfileCommand } from '@/modules/user/application/commands/update-profile.command';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ApiResponse } from '@/common/dtos/api-response';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile cá nhân' })
  async getMe(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new GetMyProfileQuery(userId));
    return ApiResponse.ok(result);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  async updateProfile(@GetMe('id') userId: string, @Body() dto: UpdateProfileDto) {
    const result = await this.commandBus.execute(new UpdateProfileCommand(userId, dto as any));
    return ApiResponse.ok(result, 'Cập nhật profile thành công');
  }
}
