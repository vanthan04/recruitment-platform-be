import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { GetMyProfileUseCase } from '@/modules/user/application/use-cases/get-my-profile.use-case';
import { UpdateProfileUseCase } from '@/modules/user/application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ApiResponse } from '@/common/dtos/api-response';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile cá nhân' })
  async getMe(@GetMe('id') userId: string) {
    const result = await this.getMyProfileUseCase.execute(userId);
    return ApiResponse.ok(result);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  async updateProfile(@GetMe('id') userId: string, @Body() dto: UpdateProfileDto) {
    const result = await this.updateProfileUseCase.execute(userId, dto as any);
    return ApiResponse.ok(result, 'Cập nhật profile thành công');
  }
}
