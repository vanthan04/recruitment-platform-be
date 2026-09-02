"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./application/auth.service");
const auth_controller_1 = require("./presentation/controllers/auth.controller");
const user_module_1 = require("../user/user.module");
const mail_module_1 = require("../mail/mail.module");
const jwt_strategy_1 = require("./presentation/security/strategies/jwt.strategy");
const register_use_case_1 = require("./application/use-cases/register.use-case");
const login_use_case_1 = require("./application/use-cases/login.use-case");
const verify_email_use_case_1 = require("./application/use-cases/verify-email.use-case");
const forgot_password_use_case_1 = require("./application/use-cases/forgot-password.use-case");
const reset_password_use_case_1 = require("./application/use-cases/reset-password.use-case");
const change_password_use_case_1 = require("./application/use-cases/change-password.use-case");
const auth_user_repository_port_1 = require("./application/ports/auth-user-repository.port");
const auth_mail_service_port_1 = require("./application/ports/auth-mail-service.port");
const refresh_token_repository_port_1 = require("./application/ports/refresh-token-repository.port");
const user_repository_adapter_1 = require("./infrastructure/adapters/user-repository.adapter");
const mail_service_adapter_1 = require("./infrastructure/adapters/mail-service.adapter");
const refresh_token_prisma_repository_1 = require("./infrastructure/persistence/refresh-token-prisma.repository");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            mail_module_1.MailModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '1d' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            register_use_case_1.RegisterUseCase,
            login_use_case_1.LoginUseCase,
            verify_email_use_case_1.VerifyEmailUseCase,
            forgot_password_use_case_1.ForgotPasswordUseCase,
            reset_password_use_case_1.ResetPasswordUseCase,
            change_password_use_case_1.ChangePasswordUseCase,
            {
                provide: auth_user_repository_port_1.IAuthUserRepositoryPort,
                useClass: user_repository_adapter_1.AuthUserAdapter,
            },
            {
                provide: auth_mail_service_port_1.IAuthMailServicePort,
                useClass: mail_service_adapter_1.AuthMailAdapter,
            },
            {
                provide: refresh_token_repository_port_1.IRefreshTokenRepositoryPort,
                useClass: refresh_token_prisma_repository_1.RefreshTokenPrismaRepository,
            },
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map