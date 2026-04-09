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
exports.RegisterUseCase = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../../../user/application/user.service");
const mail_service_interface_1 = require("../../../../common/domain/mail.service.interface");
const bcrypt = __importStar(require("bcrypt"));
let RegisterUseCase = class RegisterUseCase {
    userService;
    mailService;
    constructor(userService, mailService) {
        this.userService = userService;
        this.mailService = mailService;
    }
    async execute(dto) {
        const isExisted = await this.userService.isExistedUser(dto.email);
        if (isExisted) {
            throw new common_1.ConflictException('EMAIL_ALREADY_EXISTS');
        }
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(dto.password, salt);
        const verifyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newUser = await this.userService.createNewUser(dto.email, hashPassword, dto.fullName, verifyCode);
        await this.mailService.sendEmail({
            to: dto.email,
            subject: 'Xác thực tài khoản của bạn',
            text: `Mã xác thực của bạn là: ${verifyCode}`,
            html: `<b>Mã xác thực của bạn là: ${verifyCode}</b>`,
        });
        return {
            message: 'Tạo User thành công. Vui lòng check email để xác thực tài khoản',
            data: {
                email: newUser.email,
            },
        };
    }
};
exports.RegisterUseCase = RegisterUseCase;
exports.RegisterUseCase = RegisterUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        mail_service_interface_1.IMailService])
], RegisterUseCase);
//# sourceMappingURL=register.use-case.js.map