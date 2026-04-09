import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '@/modules/auth/application/auth.service';
import { AuthController } from '@/modules/auth/presentation/controllers/auth.controller';
import { UserModule } from '@/modules/user/user.module';
import { MailModule } from '@/modules/mail/mail.module';
import { JwtStrategy } from '@/modules/auth/presentation/security/strategies/jwt.strategy';

// Use Cases
import { RegisterUseCase } from '@/modules/auth/application/use-cases/register.use-case';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '@/modules/auth/application/use-cases/verify-email.use-case';
import { ForgotPasswordUseCase } from '@/modules/auth/application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '@/modules/auth/application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '@/modules/auth/application/use-cases/change-password.use-case';

// Ports & Adapters
import { IAuthUserRepositoryPort } from './application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from './application/ports/auth-mail-service.port';
import { AuthUserAdapter } from './infrastructure/adapters/user-repository.adapter';
import { AuthMailAdapter } from './infrastructure/adapters/mail-service.adapter';

@Module({
  imports: [
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
    RegisterUseCase,
    LoginUseCase,
    VerifyEmailUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    {
      provide: IAuthUserRepositoryPort,
      useClass: AuthUserAdapter,
    },
    {
      provide: IAuthMailServicePort,
      useClass: AuthMailAdapter,
    },
  ],
  exports: [AuthService],
})
export class AuthModule { }
