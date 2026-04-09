import { Controller, Get, Patch, Body, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserService } from '@/modules/user/application/user.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile cá nhân' })
  async getMe(@GetMe('id') userId: string) {
    return this.userService.getMyProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  async updateProfile(@GetMe('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto as any);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  async addAddress(@GetMe('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.userService.addAddress(userId, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  async updateAddress(
    @GetMe('id') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userService.updateAddress(userId, addressId, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  async deleteAddress(@GetMe('id') userId: string, @Param('id') addressId: string) {
    return this.userService.deleteAddress(userId, addressId);
  }

  @Patch('addresses/:id/set-default')
  @ApiOperation({ summary: 'Thiết lập địa chỉ mặc định' })
  async setDefaultAddress(@GetMe('id') userId: string, @Param('id') addressId: string) {
    return this.userService.setDefaultAddress(userId, addressId);
  }
}
