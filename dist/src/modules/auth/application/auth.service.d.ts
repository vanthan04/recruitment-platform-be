import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/application/user.service';
import { RegisterRequestDto } from '../presentation/dto/register-request.dto';
import { LoginRequestDto } from '../presentation/dto/login-request.dto';
import { RegisterUseCase } from './use-cases/register.use-case';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    private readonly registerUseCase;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService, registerUseCase: RegisterUseCase);
    register(dto: RegisterRequestDto): Promise<{
        message: string;
        data: {
            email: string;
        };
    }>;
    login(dto: LoginRequestDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(userId: string): Promise<void>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<void>;
    getTokens(userId: string, email: string, role: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    validateUser(payload: any): Promise<import("../../user/domain/user.entity").User | null>;
}
