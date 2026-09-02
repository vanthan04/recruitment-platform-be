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

// Handlers
import { RegisterHandler } from '@/modules/auth/application/commands/register.command';
import { LoginHandler } from '@/modules/auth/application/queries/login.query';
import { VerifyEmailHandler } from '@/modules/auth/application/commands/verify-email.command';
import { ForgotPasswordHandler } from '@/modules/auth/application/commands/forgot-password.command';
import { ResetPasswordHandler } from '@/modules/auth/application/commands/reset-password.command';
import { ChangePasswordHandler } from '@/modules/auth/application/commands/change-password.command';

// Ports & Adapters
import { IAuthUserRepositoryPort } from './application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from './application/ports/auth-mail-service.port';
import { IRefreshTokenRepositoryPort } from './application/ports/refresh-token-repository.port';
import { AuthUserAdapter } from './infrastructure/adapters/user-repository.adapter';
import { AuthMailAdapter } from './infrastructure/adapters/mail-service.adapter';
import { RefreshTokenPrismaRepository } from './infrastructure/persistence/refresh-token-prisma.repository';

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
    RegisterHandler,
    LoginHandler,
    VerifyEmailHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    ChangePasswordHandler,
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
  ],
  exports: [AuthService],
})
export class AuthModule {}
