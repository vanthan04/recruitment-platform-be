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
import type { Request, Response } from 'express';
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
//
// This is NOT the same cookie the frontend's own BFF layer manages (see
// recruitment-platform-fe's lib/middlewares/session.middleware.ts) — that
// one lives on the *frontend's* domain and is read by its server-only API
// client for its own Node-to-Node calls to this API, which never relay a
// Set-Cookie back to the browser. Two separate cookies, two separate
// origins, two separate purposes; don't try to collapse them into one.
const ACCESS_TOKEN_COOKIE = 'access_token';
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // matches AuthService.getTokens' 15m access token expiry

// `@Throttle()` is evaluated once at class-definition time (module load,
// before Nest's DI container exists), so it can't read this from an
// injected ConfigService the way every other env-driven value in this
// codebase does — reading process.env directly here is the standard way to
// make a decorator argument configurable. Real deployments should never
// set AUTH_THROTTLE_LIMIT (default 5 is the intended brute-force defense)
// — ci.yml's e2e job raises it instead, because every e2e spec file's own
// app instance now shares one real Redis-backed counter across the whole
// test run (REDIS_URL is required — see env.validation.ts), where each
// file previously had its own in-memory counter reset per app instance.
const AUTH_THROTTLE_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT) || 5;

// Populated by JwtAuthGuard (Passport) from JwtStrategy.validate()'s return
// value — see jwt.strategy.ts.
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

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
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
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
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
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
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email using code' })
  async verify(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return ApiResponse.ok(null, result.message);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return ApiResponse.ok(null, result.message);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return ApiResponse.ok(null, result.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (Authenticated)' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
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
    @Req() req: AuthenticatedRequest,
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
    @Req() req: AuthenticatedRequest,
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
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
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
