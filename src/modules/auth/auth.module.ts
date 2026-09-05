import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '@/modules/auth/application/auth.service';
import { AuthController } from '@/modules/auth/presentation/controllers/auth.controller';
import { UserModule } from '@/modules/user/user.module';
import { MailModule } from '@/modules/mail/mail.module';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { GoogleStrategy } from '@/common/strategies/google.strategy';
import { FacebookStrategy } from '@/common/strategies/facebook.strategy';
import { GoogleAuthGuard } from '@/common/guards/google-auth.guard';
import { FacebookAuthGuard } from '@/common/guards/facebook-auth.guard';

// Handlers
import { RegisterHandler } from '@/modules/auth/application/commands/register.command';
import { LoginHandler } from '@/modules/auth/application/queries/login.query';
import { VerifyEmailHandler } from '@/modules/auth/application/commands/verify-email.command';
import { ForgotPasswordHandler } from '@/modules/auth/application/commands/forgot-password.command';
import { ResetPasswordHandler } from '@/modules/auth/application/commands/reset-password.command';
import { ChangePasswordHandler } from '@/modules/auth/application/commands/change-password.command';
import { CleanupExpiredTokensHandler } from '@/modules/auth/application/commands/cleanup-expired-tokens.command';
import { CleanupExpiredTokensCron } from '@/modules/auth/application/jobs/cleanup-expired-tokens.cron';
import { SocialLoginHandler } from '@/modules/auth/application/commands/social-login.command';

// Ports & Adapters
import { IAuthUserRepositoryPort } from './application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from './application/ports/auth-mail-service.port';
import { IRefreshTokenRepositoryPort } from './application/ports/refresh-token-repository.port';
import { IVerificationTokenRepositoryPort } from './application/ports/verification-token-repository.port';
import { IOauthLoginCodeRepositoryPort } from './application/ports/oauth-login-code-repository.port';
import { AuthUserAdapter } from './infrastructure/adapters/user-repository.adapter';
import { AuthMailAdapter } from './infrastructure/adapters/mail-service.adapter';
import { RefreshTokenPrismaRepository } from './infrastructure/persistence/refresh-token-prisma.repository';
import { VerificationTokenPrismaRepository } from './infrastructure/persistence/verification-token-prisma.repository';
import { OauthLoginCodePrismaRepository } from './infrastructure/persistence/oauth-login-code-prisma.repository';

@Module({
  imports: [
    CqrsModule,
    UserModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    GoogleAuthGuard,
    FacebookAuthGuard,
    RegisterHandler,
    LoginHandler,
    VerifyEmailHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    ChangePasswordHandler,
    CleanupExpiredTokensHandler,
    CleanupExpiredTokensCron,
    SocialLoginHandler,
    {
      provide: IAuthUserRepositoryPort,
      useClass: AuthUserAdapter,
    },
    {
      provide: IAuthMailServicePort,
      useClass: AuthMailAdapter,
    },
    {
      provide: IRefreshTokenRepositoryPort,
      useClass: RefreshTokenPrismaRepository,
    },
    {
      provide: IVerificationTokenRepositoryPort,
      useClass: VerificationTokenPrismaRepository,
    },
    {
      provide: IOauthLoginCodeRepositoryPort,
      useClass: OauthLoginCodePrismaRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
