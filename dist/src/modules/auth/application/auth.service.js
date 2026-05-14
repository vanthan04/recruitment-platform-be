"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_repository_1 = require("../../user/domain/repositories/user.repository");
const register_use_case_1 = require("./use-cases/register.use-case");
const login_use_case_1 = require("./use-cases/login.use-case");
const verify_email_use_case_1 = require("./use-cases/verify-email.use-case");
const forgot_password_use_case_1 = require("./use-cases/forgot-password.use-case");
const reset_password_use_case_1 = require("./use-cases/reset-password.use-case");
const change_password_use_case_1 = require("./use-cases/change-password.use-case");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    userRepository;
    jwtService;
    configService;
    registerUseCase;
    loginUseCase;
    verifyEmailUseCase;
    forgotPasswordUseCase;
    resetPasswordUseCase;
    changePasswordUseCase;
    constructor(userRepository, jwtService, configService, registerUseCase, loginUseCase, verifyEmailUseCase, forgotPasswordUseCase, resetPasswordUseCase, changePasswordUseCase) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
        this.verifyEmailUseCase = verifyEmailUseCase;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.changePasswordUseCase = changePasswordUseCase;
    }
    async register(dto) {
        return this.registerUseCase.execute(dto);
    }
    async login(dto) {
        const user = await this.loginUseCase.execute(dto);
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }
    async verifyEmail(dto) {
        return this.verifyEmailUseCase.execute(dto);
    }
    async forgotPassword(dto) {
        return this.forgotPasswordUseCase.execute(dto);
    }
    async resetPassword(dto) {
        return this.resetPasswordUseCase.execute(dto);
    }
    async changePassword(userId, dto) {
        return this.changePasswordUseCase.execute(userId, dto);
    }
    async logout(userId) {
        return this.userRepository.updateRefreshToken(userId, null);
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const userId = payload.sub;
            const user = await this.userRepository.findById(userId);
            if (!user || !user.refreshToken) {
                throw new common_1.ForbiddenException('Access Denied');
            }
            const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!refreshTokenMatches) {
                throw new common_1.ForbiddenException('Access Denied');
            }
            const tokens = await this.getTokens(user.id, user.email, user.role);
            await this.updateRefreshToken(user.id, tokens.refresh_token);
            return tokens;
        }
        catch (e) {
            throw new common_1.ForbiddenException('Invalid Refresh Token');
        }
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = refreshToken
            ? await bcrypt.hash(refreshToken, 10)
            : null;
        await this.userRepository.updateRefreshToken(userId, hashedRefreshToken);
    }
    async getTokens(userId, email, role) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({
                sub: userId,
                email,
                role,
            }, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync({
                sub: userId,
                email,
                role,
            }, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async validateUser(payload) {
        return this.userRepository.findById(payload.sub);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.IUserRepository,
        jwt_1.JwtService,
        config_1.ConfigService,
        register_use_case_1.RegisterUseCase,
        login_use_case_1.LoginUseCase,
        verify_email_use_case_1.VerifyEmailUseCase,
        forgot_password_use_case_1.ForgotPasswordUseCase,
        reset_password_use_case_1.ResetPasswordUseCase,
        change_password_use_case_1.ChangePasswordUseCase])
], AuthService);
//# sourceMappingURL=auth.service.js.map