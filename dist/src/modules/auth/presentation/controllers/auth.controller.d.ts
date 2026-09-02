import { AuthService } from '@/modules/auth/application/auth.service';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { RefreshTokenDto } from '@/modules/auth/presentation/dtos/refresh-token.dto';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterRequestDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        email: string;
    }>>;
    login(dto: LoginRequestDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        access_token: string;
        refresh_token: string;
    }>>;
    verify(dto: VerifyEmailDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    forgotPassword(dto: ForgotPasswordDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    resetPassword(dto: ResetPasswordDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    logout(req: any, dto: RefreshTokenDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    logoutAll(req: any): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
    refresh(dto: RefreshTokenDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        access_token: string;
        refresh_token: string;
    }>>;
}
