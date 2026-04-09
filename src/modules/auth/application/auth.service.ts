import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/user/application/user.service';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { RegisterUseCase } from '@/modules/auth/application/use-cases/register.use-case';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '@/modules/auth/application/use-cases/verify-email.use-case';
import { ForgotPasswordUseCase } from '@/modules/auth/application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '@/modules/auth/application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '@/modules/auth/application/use-cases/change-password.use-case';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) { }

  async register(dto: RegisterRequestDto) {
    return this.registerUseCase.execute(dto);
  }

  async login(dto: LoginRequestDto) {
    const user = await this.loginUseCase.execute(dto);

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(dto);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.changePasswordUseCase.execute(userId, dto);
  }

  async logout(userId: string) {
    return this.userService.updateRefreshToken(userId, null);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const userId = payload.sub;

      const user = await this.userService.findById(userId);
      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!refreshTokenMatches) {
        throw new ForbiddenException('Access Denied');
      }

      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch (e) {
      throw new ForbiddenException('Invalid Refresh Token');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken 
      ? await bcrypt.hash(refreshToken, 10) 
      : null;
    
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
  }

  async getTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async validateUser(payload: any) {
    return this.userService.findById(payload.sub);
  }
}
