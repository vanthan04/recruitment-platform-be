"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordUseCase = void 0;
const common_1 = require("@nestjs/common");
const auth_user_repository_port_1 = require("../ports/auth-user-repository.port");
const auth_mail_service_port_1 = require("../ports/auth-mail-service.port");
let ForgotPasswordUseCase = class ForgotPasswordUseCase {
    userRepository;
    mailService;
    constructor(userRepository, mailService) {
        this.userRepository = userRepository;
        this.mailService = mailService;
    }
    async execute(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng với email này');
        }
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        user.verifyCode = resetCode;
        await this.userRepository.save(user);
        await this.mailService.sendEmail({
            to: user.email,
            subject: 'Yêu cầu khôi phục mật khẩu',
            text: `Mã khôi phục mật khẩu của bạn là: ${resetCode}`,
            html: `<b>Mã khôi phục mật khẩu của bạn là: ${resetCode}</b>`,
        });
        return {
            message: 'Mã khôi phục mật khẩu đã được gửi vào email của bạn',
        };
    }
};
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
exports.ForgotPasswordUseCase = ForgotPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_user_repository_port_1.IAuthUserRepositoryPort,
        auth_mail_service_port_1.IAuthMailServicePort])
], ForgotPasswordUseCase);
//# sourceMappingURL=forgot-password.use-case.js.map