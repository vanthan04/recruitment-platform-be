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
exports.AuthUserAdapter = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../../../user/domain/repositories/user.repository");
let AuthUserAdapter = class AuthUserAdapter {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        return this.userRepository.findById(id);
    }
    async findByEmail(email) {
        return this.userRepository.findByEmail(email);
    }
    async existsByEmail(email) {
        return this.userRepository.existsByEmail(email);
    }
    async save(data) {
        return this.userRepository.save({
            email: data.email,
            password: data.password,
            verifyCode: data.verifyCode,
            role: data.role,
            status: data.status,
            profile: data.fullName ? {
                fullName: data.fullName
            } : undefined
        });
    }
    async updateRefreshToken(id, refreshToken) {
        return this.userRepository.updateRefreshToken(id, refreshToken);
    }
    async findByVerifyCode(code) {
        return this.userRepository.findByVerifyCode(code);
    }
};
exports.AuthUserAdapter = AuthUserAdapter;
exports.AuthUserAdapter = AuthUserAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.IUserRepository])
], AuthUserAdapter);
//# sourceMappingURL=user-repository.adapter.js.map