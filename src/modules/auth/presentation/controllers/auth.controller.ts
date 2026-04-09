import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '@/modules/auth/application/auth.service';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { RefreshTokenDto } from '@/modules/auth/presentation/dtos/refresh-token.dto';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import { ApiResponse } from '@/common/dtos/api-response';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterRequestDto) {
    const result = await this.authService.register(dto);
    return ApiResponse.ok(result, "Tạo User thành công. Vui lòng check email để xác thực tài khoản");
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() dto: LoginRequestDto) {
    const result = await this.authService.login(dto);
    return ApiResponse.ok(result, 'Đăng nhập thành công');
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using code' })
  async verify(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return ApiResponse.ok(null, result.message);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return ApiResponse.ok(null, result.message);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return ApiResponse.ok(null, result.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (Authenticated)' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const result = await this.authService.changePassword(req.user.userId, dto);
    return ApiResponse.ok(null, result.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId);
    return ApiResponse.ok(null, 'Đăng xuất thành công');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    return ApiResponse.ok(result, 'Làm mới token thành công');
  }
}
