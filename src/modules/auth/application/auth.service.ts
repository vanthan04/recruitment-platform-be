import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { RegisterCommand } from '@/modules/auth/application/commands/register.command';
import { LoginQuery } from '@/modules/auth/application/queries/login.query';
import { VerifyEmailCommand } from '@/modules/auth/application/commands/verify-email.command';
import { ForgotPasswordCommand } from '@/modules/auth/application/commands/forgot-password.command';
import { ResetPasswordCommand } from '@/modules/auth/application/commands/reset-password.command';
import { ChangePasswordCommand } from '@/modules/auth/application/commands/change-password.command';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // matches the 7d expiresIn below

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async register(dto: RegisterRequestDto) {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  async login(dto: LoginRequestDto) {
    const user = await this.queryBus.execute(new LoginQuery(dto));

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.commandBus.execute(new ForgotPasswordCommand(dto));
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.commandBus.execute(new ChangePasswordCommand(userId, dto));
  }

  /** Logout this device only — revokes just the session tied to the given refresh token. */
  async logout(userId: string, refreshToken: string) {
    await this.refreshTokenRepository.revokeByHash(userId, this.hashToken(refreshToken));
  }

  /** Logout everywhere — revokes every active session for the user. */
  async logoutAll(userId: string) {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Invalid Refresh Token');
    }

    const userId = payload.sub;
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (!stored || stored.userId !== userId) {
      throw new ForbiddenException('Access Denied');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    // Rotate: the old refresh token is single-use — revoke it before issuing a new pair.
    await this.refreshTokenRepository.revokeByHash(userId, tokenHash);

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.refreshTokenRepository.create(userId, tokenHash, expiresAt);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
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
          // Random jti guarantees a unique token even when issued within the same
          // second for the same user (e.g. logging in from two devices at once) —
          // JWTs are otherwise a deterministic function of payload + secret.
          jti: crypto.randomUUID(),
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
    return this.userRepository.findById(payload.sub);
  }
}
