import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from '@/modules/auth/application/auth.service';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { RefreshTokenDto } from '@/modules/auth/presentation/dtos/refresh-token.dto';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import { SocialExchangeDto } from '@/modules/auth/presentation/dtos/social-exchange.dto';
import { ApiResponse } from '@/common/dtos/api-response';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from '@/common/guards/google-auth.guard';
import { FacebookAuthGuard } from '@/common/guards/facebook-auth.guard';
import { SocialProfile } from '@/common/strategies/google.strategy';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// The chat WebSocket gateway (ws-auth.util.ts) authenticates the socket
// handshake by reading this same cookie off `handshake.headers.cookie` — a
// browser has no way to attach an Authorization header to a WS handshake,
// so this is the only channel it has. REST calls keep using the JSON-body
// access_token as a Bearer header, same as always; this cookie is additive.
const ACCESS_TOKEN_COOKIE = 'access_token';
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // matches AuthService.getTokens' 15m access token expiry

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: isProduction,
      // Frontend and backend are cross-origin (different hosts) in
      // production, and a cross-site cookie needs SameSite=None — which
      // browsers only honor alongside Secure. Locally both run on
      // `localhost` (same site regardless of port), so Lax already works
      // and doesn't require HTTPS in dev.
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  private clearAccessTokenCookie(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterRequestDto) {
    const result = await this.authService.register(dto);
    return ApiResponse.ok(
      result,
      'User created successfully. Please check your email to verify your account.',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAccessTokenCookie(res, result.access_token);
    return ApiResponse.ok(result, 'Logged in successfully');
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
    const result = await this.authService.changePassword(req.user.id, dto);
    return ApiResponse.ok(null, result.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout current device (revokes the given refresh token)',
  })
  async logout(
    @Req() req: any,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id, dto.refreshToken);
    this.clearAccessTokenCookie(res);
    return ApiResponse.ok(null, 'Logged out successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from all devices (revokes every active session)',
  })
  async logoutAll(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.id);
    this.clearAccessTokenCookie(res);
    return ApiResponse.ok(null, 'Logged out from all devices successfully');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    this.setAccessTokenCookie(res, result.access_token);
    return ApiResponse.ok(result, 'Token refreshed successfully');
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google login (redirects to Google)' })
  googleAuth() {
    // Never reached — GoogleAuthGuard redirects to Google's consent screen
    // before the handler body would run.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback (redirects to frontend)' })
  async googleCallback(
    @Req()
    req: { user: SocialProfile | { error: string }; query: { state?: string } },
    @Res() res: Response,
  ) {
    return this.handleSocialCallback(req, res);
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Start Facebook login (redirects to Facebook)' })
  facebookAuth() {
    // Never reached — FacebookAuthGuard redirects to Facebook's consent
    // screen before the handler body would run.
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback (redirects to frontend)' })
  async facebookCallback(
    @Req()
    req: { user: SocialProfile | { error: string }; query: { state?: string } },
    @Res() res: Response,
  ) {
    return this.handleSocialCallback(req, res);
  }

  @Post('social/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Exchange a social-login code for JWT tokens' })
  async socialExchange(
    @Body() dto: SocialExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.exchangeSocialCode(dto.code);
    this.setAccessTokenCookie(res, result.access_token);
    return ApiResponse.ok(result, 'Logged in successfully');
  }

  private async handleSocialCallback(
    req: { user: SocialProfile | { error: string }; query: { state?: string } },
    res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if ('error' in req.user) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${req.user.error}`,
      );
    }

    try {
      const { code } = await this.authService.socialLogin(
        req.user,
        req.query.state,
      );
      return res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
    } catch {
      // Never let a callback route return a raw JSON 500 into a full-page
      // browser redirect — always land the user back on the frontend.
      return res.redirect(`${frontendUrl}/auth/callback?error=OAUTH_FAILED`);
    }
  }
}
