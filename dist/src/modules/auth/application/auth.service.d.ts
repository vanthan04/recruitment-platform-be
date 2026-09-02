import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
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
export declare class AuthService {
    private readonly userRepository;
    private readonly refreshTokenRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly registerUseCase;
    private readonly loginUseCase;
    private readonly verifyEmailUseCase;
    private readonly forgotPasswordUseCase;
    private readonly resetPasswordUseCase;
    private readonly changePasswordUseCase;
    constructor(userRepository: IUserRepository, refreshTokenRepository: IRefreshTokenRepositoryPort, jwtService: JwtService, configService: ConfigService, registerUseCase: RegisterUseCase, loginUseCase: LoginUseCase, verifyEmailUseCase: VerifyEmailUseCase, forgotPasswordUseCase: ForgotPasswordUseCase, resetPasswordUseCase: ResetPasswordUseCase, changePasswordUseCase: ChangePasswordUseCase);
    register(dto: RegisterRequestDto): Promise<{
        email: string;
    }>;
    login(dto: LoginRequestDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    refreshTokens(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    private storeRefreshToken;
    private hashToken;
    getTokens(userId: string, email: string, role: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    validateUser(payload: any): Promise<import("../../user/domain/entities/user.entity").User | null>;
}
