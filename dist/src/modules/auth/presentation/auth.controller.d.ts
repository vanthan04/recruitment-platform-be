import { AuthService } from '../application/auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterRequestDto): Promise<import("../../../common/dtos/response.dto").ResponseDto<{
        email: string;
    }>>;
    login(dto: LoginRequestDto): Promise<import("../../../common/dtos/response.dto").ResponseDto<{
        access_token: string;
        refresh_token: string;
    }>>;
    logout(req: any): Promise<import("../../../common/dtos/response.dto").ResponseDto<null>>;
    refresh(dto: RefreshTokenDto): Promise<import("../../../common/dtos/response.dto").ResponseDto<{
        access_token: string;
        refresh_token: string;
    }>>;
    private decodeToken;
}
