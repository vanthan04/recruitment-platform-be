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
exports.GetMyProfileUseCase = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../../domain/repositories/user.repository");
let GetMyProfileUseCase = class GetMyProfileUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(userId) {
        const user = await this.userRepository.findByIdWithProfile(userId);
        if (!user) {
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        }
        const { password, refreshToken, verifyCode, ...safeUser } = user;
        return safeUser;
    }
};
exports.GetMyProfileUseCase = GetMyProfileUseCase;
exports.GetMyProfileUseCase = GetMyProfileUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.IUserRepository])
], GetMyProfileUseCase);
//# sourceMappingURL=get-my-profile.use-case.js.map